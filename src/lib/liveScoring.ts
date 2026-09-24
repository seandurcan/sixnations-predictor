import { prisma } from "@/lib/prisma";
import { assignCompetitionRanks, calculateMatchScore } from "@/lib/scoring";
import type { Prisma } from "@prisma/client";
import { getActiveTournaments } from "@/lib/currentTournament";
import { generateCompletedRoundStory } from "@/lib/competitionStories";
import { advanceKnockoutWinner } from "@/lib/knockoutBracket";

export const POLL_INTERVAL_MS = 30 * 1000;
// Match records have no expected-end field. Allow two hours from kickoff,
// then a further 30 minutes for stoppages / delayed provider results.
export const EXPECTED_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;
export const SAFETY_CUTOFF_MS = 30 * 60 * 1000;
const MATCH_WINDOW_MS = EXPECTED_MATCH_WINDOW_MS + SAFETY_CUTOFF_MS;

type ScoreSource = "ADMIN" | "API-Sports";
type ApplyScoreArgs = {
  matchId: number;
  homeScore: number;
  awayScore: number;
  completed: boolean;
  source: ScoreSource;
  adminUserId: number;
  manualOverride?: boolean;
  providerGameId?: number | null;
  providerStatus?: string | null;
  previousProviderStatus?: string | null;
};
type ApiSportsGame = {
  id?: number;
  game?: { id?: number };
  teams?: { home?: { name?: string }; away?: { name?: string } };
  scores?: { home?: number | null; away?: number | null };
  status?: string | { long?: string; short?: string };
};

function normalise(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}
function teamMatches(actual: unknown, expected: string) {
  const candidate = normalise(actual);
  const wanted = normalise(expected);
  return Boolean(candidate && wanted) &&
    (candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate));
}
function providerStatus(game: ApiSportsGame) {
  if (typeof game.status === "string") return game.status;
  return game.status?.long ?? game.status?.short ?? "In progress";
}
function isTerminalStatus(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  if (["ft", "aet", "ap", "canc", "abd", "post", "postponed"].includes(value)) return true;
  return ["finished","full time","after extra time","after penalties","cancelled","abandoned"]
    .some((item) => value.includes(item));
}
function dublinDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Dublin", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}
async function getSetting(key: string) {
  return prisma.systemSetting.findUnique({ where: { key } });
}
async function setSetting(key: string, value: string) {
  return prisma.systemSetting.upsert({
    where: { key }, update: { value }, create: { key, value }
  });
}
function parseMeta(value: string | null | undefined) {
  if (!value) return null;
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
}

export async function applyMatchScore(args: ApplyScoreArgs) {
  // Serialize provider writes with manual corrections. A request already in
  // flight cannot overwrite an Admin save made while it fetched the score.
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(82315, ${args.matchId}::integer)`;
    const current = await tx.match.findUnique({ where: { id: args.matchId } });
    if (!current) throw new Error("Match not found");
    if (args.source === "API-Sports") {
      const override = await tx.systemSetting.findUnique({ where: { key: "LIVE_SCORE_OVERRIDE_" + args.matchId } });
      const meta = current.completed ? await tx.systemSetting.findUnique({ where: { key: "LIVE_SCORE_META_" + args.matchId } }) : null;
      const providerFinished = current.completed && parseMeta(meta?.value)?.source !== "ADMIN";
      if (override?.value === "true" || providerFinished || Date.now() > current.kickoffTime.getTime() + MATCH_WINDOW_MS) {
        return { match: current, snapshotNumber: null, skipped: true };
      }
    }
    return applyMatchScoreInTransaction(args, tx);
  }, { maxWait: 10000, timeout: 30000 });

  if (!result.skipped && args.completed) {
    if (args.homeScore !== args.awayScore) {
      const winnerTeamId = args.homeScore > args.awayScore
        ? result.match.homeTeamId
        : result.match.awayTeamId;
      await advanceKnockoutWinner(result.match.tournamentId, result.match.id, winnerTeamId)
        .catch((error) => console.error("Knockout progression failed", error));
    }
    await generateCompletedRoundStory(result.match.tournamentId, result.match.round)
      .catch((error) => console.error("Competition story generation failed", error));
  }

  return result;
}

async function applyMatchScoreInTransaction(args: ApplyScoreArgs, prisma: Prisma.TransactionClient) {
  const setSetting = (key: string, value: string) => prisma.systemSetting.upsert({
    where: { key }, update: { value }, create: { key, value },
  });
  const existingMatch = await prisma.match.findUnique({ where: { id: args.matchId } });
  if (!existingMatch) throw new Error("Match not found");

  const scoreChanged =
    existingMatch.actualHomeScore !== args.homeScore ||
    existingMatch.actualAwayScore !== args.awayScore;
  const completionChanged = existingMatch.completed !== args.completed;

  const audit = await prisma.scoreAudit.create({
    data: {
      matchId: args.matchId,
      previousHome: existingMatch.actualHomeScore,
      previousAway: existingMatch.actualAwayScore,
      newHome: args.homeScore,
      newAway: args.awayScore,
      adminUserId: args.adminUserId,
    },
  });

  const match = await prisma.match.update({
    where: { id: args.matchId },
    data: {
      actualHomeScore: args.homeScore,
      actualAwayScore: args.awayScore,
      completed: args.completed,
    },
  });

  let snapshotNumber: number | null = null;

  if (scoreChanged) {
    const predictions = await prisma.prediction.findMany({ where: { matchId: args.matchId } });
    for (const prediction of predictions) {
      const score = calculateMatchScore(
        prediction.predictedHomeScore,
        prediction.predictedAwayScore,
        args.homeScore,
        args.awayScore
      );
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          pointsAwarded: score.pointsAwarded,
          errorValue: score.errorValue,
          exactScore: score.exactScore,
          correctMargin: score.correctMargin,
          correctResult: score.correctResult,
          differenceScore: score.differenceScore,
        },
      });
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null, competitionEntries: { some: { tournamentId: match.tournamentId, status: "ENTERED" } } },
      include: {
        predictions: { where: { match: { tournamentId: match.tournamentId } } },
        competitionEntries: { where: { tournamentId: match.tournamentId }, take: 1 },
      },
    });
    for (const user of users) {
      const totalPoints = user.predictions.reduce((total, p) => total + p.pointsAwarded, 0);
      const cumulativeError = user.predictions.reduce((total, p) => total + p.errorValue, 0);
      const exactScores = user.predictions.filter((p) => p.exactScore).length;
      await prisma.user.update({
        where: { id: user.id },
        data: { totalPoints, cumulativeError, exactScores },
      });
      await prisma.competitionEntry.updateMany({
        where: { userId: user.id, tournamentId: match.tournamentId },
        data: { totalPoints, cumulativeError, exactScores },
      });
    }

    const latestSnapshot = await prisma.leaderboardSnapshot.findFirst({
      where: { tournamentId: match.tournamentId },
      orderBy: { snapshotNumber: "desc" },
    });
    snapshotNumber = (latestSnapshot?.snapshotNumber ?? 0) + 1;

    const refreshedUsers = await prisma.user.findMany({
      where: { deletedAt: null, competitionEntries: { some: { tournamentId: match.tournamentId, status: "ENTERED" } } },
      include: {
        predictions: { where: { match: { tournamentId: match.tournamentId } } },
        competitionEntries: { where: { tournamentId: match.tournamentId }, take: 1 },
      },
    });
    const rankings = assignCompetitionRanks(
      refreshedUsers.map((user) => ({
        id: user.id,
        totalPoints: user.competitionEntries[0]?.totalPoints ?? 0,
        exactScores: user.competitionEntries[0]?.exactScores ?? 0,
        cumulativeError: user.competitionEntries[0]?.cumulativeError ?? 0,
        differenceScore: user.predictions.reduce((total, p) => total + p.differenceScore, 0),
        correctMargins: user.predictions.filter((p) => p.correctMargin).length,
        correctResults: user.predictions.filter((p) => p.correctResult).length,
      }))
    );

    const previousSnapshots = latestSnapshot
      ? await prisma.leaderboardSnapshot.findMany({
          where: { tournamentId: match.tournamentId, snapshotNumber: latestSnapshot.snapshotNumber },
        })
      : [];

    for (const user of rankings) {
      const previousSnapshot = previousSnapshots.find((s) => s.userId === user.id);
      const previousRank = previousSnapshot?.rank ?? null;
      const rankMovement = previousRank === null ? null : previousRank - user.rank;
      await prisma.leaderboardSnapshot.create({
        data: {
          tournamentId: match.tournamentId,
          userId: user.id,
          snapshotNumber,
          rank: user.rank,
          previousRank,
          rankMovement,
          totalPoints: user.totalPoints,
          cumulativeError: user.cumulativeError,
          exactScores: user.exactScores,
          correctMargins: user.correctMargins,
          correctResults: user.correctResults,
        },
      });
    }
  }

  if (args.completed) {
    const completedMatches = await prisma.match.count({
      where: { completed: true, tournamentId: match.tournamentId },
    });
    const totalMatches = await prisma.match.count({
      where: { tournamentId: match.tournamentId },
    });

    if (totalMatches > 0 && completedMatches === totalMatches) {
      await prisma.tournament.update({
        where: { id: match.tournamentId },
        data: { status: "COMPLETED" },
      });

      const users = await prisma.user.findMany({
        where: { deletedAt: null, competitionEntries: { some: { tournamentId: match.tournamentId, status: "ENTERED" } } },
        include: {
        predictions: { where: { match: { tournamentId: match.tournamentId } } },
        competitionEntries: { where: { tournamentId: match.tournamentId }, take: 1 },
      },
      });
      const rankings = assignCompetitionRanks(
        users.map((user) => ({
          id: user.id,
          totalPoints: user.totalPoints,
          exactScores: user.exactScores,
          cumulativeError: user.cumulativeError,
          differenceScore: user.predictions.reduce((total, p) => total + p.differenceScore, 0),
          correctMargins: user.predictions.filter((p) => p.correctMargin).length,
          correctResults: user.predictions.filter((p) => p.correctResult).length,
        }))
      );

      const podium = rankings.filter((entrant) => entrant.rank <= 3);
      await prisma.tournamentWinner.deleteMany({ where: { tournamentId: match.tournamentId } });
      if (podium.length > 0) {
        await prisma.tournamentWinner.createMany({
          data: podium.map((entrant) => ({
            tournamentId: match.tournamentId,
            userId: entrant.id,
            finalPoints: entrant.totalPoints,
            rank: entrant.rank,
          })),
        });
      }
    }
  }

  await setSetting(
    "LIVE_SCORE_AUDIT_" + audit.id,
    JSON.stringify({
      source: args.source,
      providerGameId: args.providerGameId ?? null,
      previousStatus: args.previousProviderStatus ?? null,
      newStatus: args.providerStatus ?? (args.completed ? "Full Time" : "Live"),
      leaderboardRecalculated: scoreChanged,
      scoreChanged,
      completionChanged,
      createdAt: new Date().toISOString(),
    })
  );

  await setSetting(
    "LIVE_SCORE_META_" + args.matchId,
    JSON.stringify({
      source: args.source,
      providerGameId: args.providerGameId ?? null,
      status: args.providerStatus ?? (args.completed ? "Full Time" : "Live"),
      updatedAt: new Date().toISOString(),
    })
  );

  if (args.source === "ADMIN" && args.manualOverride !== false) {
    await setSetting("LIVE_SCORE_OVERRIDE_" + args.matchId, "true");
  }
  return { match, snapshotNumber, skipped: false };
}

export async function setManualOverride(matchId: number, enabled: boolean) {
  await setSetting("LIVE_SCORE_OVERRIDE_" + matchId, enabled ? "true" : "false");
}

export async function getLiveScoreInfo(matchId: number) {
  const [metaSetting, overrideSetting] = await Promise.all([
    getSetting("LIVE_SCORE_META_" + matchId),
    getSetting("LIVE_SCORE_OVERRIDE_" + matchId),
  ]);
  const meta = parseMeta(metaSetting?.value);
  return {
    liveSource: typeof meta?.source === "string" ? meta.source : null,
    liveStatus: typeof meta?.status === "string" ? meta.status : null,
    providerGameId: typeof meta?.providerGameId === "number" ? meta.providerGameId : null,
    liveUpdatedAt: typeof meta?.updatedAt === "string" ? meta.updatedAt : null,
    manualOverride: overrideSetting?.value === "true",
  };
}

export async function enrichMatchesWithLiveScoreInfo<T extends { id: number }>(matches: T[]) {
  return Promise.all(matches.map(async (match) => ({
    ...match,
    ...(await getLiveScoreInfo(match.id)),
  })));
}

export async function syncLiveScores() {
  const now = Date.now();
  const activeTournaments = await getActiveTournaments();

  if (activeTournaments.length === 0) {
    return { checked: true, activeMatches: 0, providerQueries: 0, updates: 0 };
  }

  const candidates = await prisma.match.findMany({
    where: {
      tournamentId: { in: activeTournaments.map((tournament) => tournament.id) },
      kickoffTime: { lte: new Date(now), gte: new Date(now - MATCH_WINDOW_MS) },
    },
    include: { homeTeam: true, awayTeam: true },
  });

  const active = [];
  for (const match of candidates) {
    const kickoff = match.kickoffTime.getTime();
    if (now < kickoff || now > kickoff + MATCH_WINDOW_MS) continue;
    // A provider final result stops polling. An Admin result can explicitly
    // hand control back through Resume API Updates, even if marked full time.
    if (match.completed) {
      const meta = await getSetting("LIVE_SCORE_META_" + match.id);
      if (parseMeta(meta?.value)?.source !== "ADMIN") continue;
    }
    active.push(match);
  }

  if (active.length === 0) {
    return { checked: true, activeMatches: 0, providerQueries: 0, updates: 0 };
  }

  const apiKey =
    process.env.API_SPORTS_KEY ??
    process.env.APISPORTS_RUGBY_KEY ??
    process.env.API_RUGBY_KEY;

  if (!apiKey) {
    return {
      checked: true,
      activeMatches: active.length,
      providerQueries: 0,
      updates: 0,
      error: "API-Sports key is not configured",
    };
  }

  const due = [];
  for (const match of active) {
    const override = await getSetting("LIVE_SCORE_OVERRIDE_" + match.id);
    if (override?.value === "true") continue;

    const slotSetting = await getSetting("LIVE_SCORE_SLOT_" + match.id);
    if (slotSetting && now - Number(slotSetting.value) < POLL_INTERVAL_MS) continue;
    due.push(match);
  }

  if (due.length === 0) {
    return {
      checked: true,
      activeMatches: active.length,
      providerQueries: 0,
      updates: 0,
    };
  }

  const systemAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!systemAdmin) {
    return {
      checked: true,
      activeMatches: active.length,
      providerQueries: 0,
      updates: 0,
      error: "No administrator account is available",
    };
  }

  const byDate = new Map<string, typeof due>();
  for (const match of due) {
    // Claim before the request, including failed provider attempts. Atomic
    // compare-and-set prevents multiple open pages/instances doubling calls.
    const key = "LIVE_SCORE_SLOT_" + match.id;
    const previous = await getSetting(key);
    if (previous && now - Number(previous.value) < POLL_INTERVAL_MS) continue;
    if (previous) {
      const claim = await prisma.systemSetting.updateMany({
        where: { key, value: previous.value }, data: { value: String(now) },
      });
      if (claim.count !== 1) continue;
    } else {
      try {
        await prisma.systemSetting.create({ data: { key, value: String(now) } });
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") continue;
        throw error;
      }
    }
    const date = dublinDate(match.kickoffTime);
    const list = byDate.get(date) ?? [];
    list.push(match);
    byDate.set(date, list);
  }

  let providerQueries = 0;
  let updates = 0;

  for (const [date, dateMatches] of byDate) {
    providerQueries++;
    try {
    const response = await fetch(
      "https://v1.rugby.api-sports.io/games?date=" + date,
      {
        headers: { "x-apisports-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) continue;

    const payload = (await response.json()) as { response?: ApiSportsGame[] };
    const games = Array.isArray(payload.response) ? payload.response : [];

    for (const match of dateMatches) {
      const game = games.find(
        (item) =>
          teamMatches(item.teams?.home?.name, match.homeTeam.name) &&
          teamMatches(item.teams?.away?.name, match.awayTeam.name)
      );

      if (!game) continue;
      if (game.scores?.home == null || game.scores?.away == null) continue;

      const homeScore = Number(game.scores?.home);
      const awayScore = Number(game.scores?.away);
      if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;

      const status = providerStatus(game);
      const completed = isTerminalStatus(status);

      const metaSetting = await getSetting("LIVE_SCORE_META_" + match.id);
      const previousMeta = parseMeta(metaSetting?.value);
      const previousStatus =
        typeof previousMeta?.status === "string" ? previousMeta.status : null;

      const scoreChanged =
        match.actualHomeScore !== homeScore ||
        match.actualAwayScore !== awayScore;
      const statusChanged = previousStatus !== status;
      const completionChanged = match.completed !== completed;

      if (!scoreChanged && !statusChanged && !completionChanged) continue;

      const applied = await applyMatchScore({
        matchId: match.id,
        homeScore,
        awayScore,
        completed,
        source: "API-Sports",
        adminUserId: systemAdmin.id,
        providerGameId: Number(game.id ?? game.game?.id) || null,
        providerStatus: status,
        previousProviderStatus: previousStatus,
      });

      if (!applied.skipped) updates++;
    }
    } catch (error) {
      console.error("Live score provider sync failed", error);
    }
  }

  return {
    checked: true,
    activeMatches: active.length,
    providerQueries,
    updates,
  };
}
