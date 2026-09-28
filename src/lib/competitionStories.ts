import { prisma } from "@/lib/prisma";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { assignCompetitionRanks } from "@/lib/scoring";
import { headers } from "next/headers";

export const COMPETITION_STORY_PREFIX = "COMPETITION_STORY_";

const STORY_VERSION = 3;
const FALLBACK_RETRY_MS = 6 * 60 * 60 * 1000;

export type StoryPayload = {
  tournamentId: number;
  round: number;
  headline: string;
  standfirst?: string;
  body: string;
  generatedAt: string;
  version?: number;
  generation?: "ai" | "fallback";
};

type EntryWithUser = {
  userId: number;
  user: {
    firstName: string;
    lastName: string;
  };
};

type PredictionRow = {
  userId: number;
  matchId: number;
  pointsAwarded: number;
  exactScore: boolean;
  correctMargin: boolean;
  correctResult: boolean;
  differenceScore: number;
};

type RankedEntrant = {
  id: number;
  name: string;
  totalPoints: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
  differenceScore: number;
  rank: number;
};

function entrantName(entry: EntryWithUser) {
  return (entry.user.firstName + " " + entry.user.lastName).trim();
}

function buildRankings(
  entries: EntryWithUser[],
  predictions: PredictionRow[],
  matchIds: Set<number>
): RankedEntrant[] {
  const rows = entries.map((entry) => {
    const own = predictions.filter(
      (prediction) => prediction.userId === entry.userId && matchIds.has(prediction.matchId)
    );

    return {
      id: entry.userId,
      name: entrantName(entry),
      totalPoints: own.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0),
      exactScores: own.filter((prediction) => prediction.exactScore).length,
      correctMargins: own.filter((prediction) => prediction.correctMargin).length,
      correctResults: own.filter((prediction) => prediction.correctResult).length,
      differenceScore: own.reduce((sum, prediction) => sum + prediction.differenceScore, 0),
    };
  });

  return assignCompetitionRanks(rows);
}

function movementLabel(movement: number | null) {
  if (movement === null) return "first recorded round";
  if (movement > 0) return "up " + movement;
  if (movement < 0) return "down " + Math.abs(movement);
  return "unchanged";
}

function parseAiArticle(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^\x60\x60\x60(?:json)?\s*/i, "")
    .replace(/\s*\x60\x60\x60$/, "");

  try {
    const parsed = JSON.parse(cleaned) as {
      headline?: unknown;
      standfirst?: unknown;
      body?: unknown;
    };

    if (
      typeof parsed.headline !== "string" ||
      typeof parsed.standfirst !== "string" ||
      typeof parsed.body !== "string"
    ) {
      return null;
    }

    const headline = parsed.headline.trim();
    const standfirst = parsed.standfirst.trim();
    const body = parsed.body.trim();

    if (headline.length < 8 || standfirst.length < 20 || body.length < 180) return null;
    return { headline, standfirst, body };
  } catch {
    return null;
  }
}

async function getGatewayToken() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;

  try {
    const requestHeaders = await headers();
    const requestToken = requestHeaders.get("x-vercel-oidc-token");
    if (requestToken) return requestToken;
  } catch {
    // Story generation can still use an environment token outside request scope.
  }

  return process.env.VERCEL_OIDC_TOKEN ?? null;
}

async function writeAiArticle(factPack: unknown) {
  const gatewayToken = await getGatewayToken();
  const openAiToken = process.env.OPENAI_API_KEY;

  const gateway = Boolean(gatewayToken);
  const token = gatewayToken ?? openAiToken;
  if (!token) {
    console.warn("AI competition story generation skipped: no AI credential available");
    return null;
  }

  const endpoint = gateway
    ? "https://ai-gateway.vercel.sh/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = gateway ? "openai/gpt-6-luna" : "gpt-6-luna";

  const systemInstruction = [
    "You are the Perfect XV Sports Desk: an experienced professional rugby and sports journalist.",
    "Write a lively round report about the prediction competition, not a mechanical leaderboard summary.",
    "Use natural British/Irish English, strong narrative flow, human warmth, tension and restrained humour where the facts support it.",
    "Entrants are the characters in the story. Explain who had a great round, who moved, who leads, and what changed.",
    "Weave statistics into prose instead of listing them. Mention rugby results when they help explain the prediction contest.",
    "Never invent quotes, motives, incidents, relationships, rivalries, nicknames or facts. Do not claim somebody was confident, devastated, lucky or careless unless the supplied facts establish it.",
    "Do not use generic filler such as 'the race is heating up' unless you immediately support it with a specific fact.",
    "Do not explain the scoring rules unless they are directly relevant to a notable event.",
    "Aim for 350-500 words in 5-7 short paragraphs.",
    "Return JSON only with exactly three string fields: headline, standfirst, body.",
    "The body must contain paragraph breaks as \\n\\n and no Markdown."
  ].join(" ");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        {
          role: "user",
          content:
            "Write the Round report using only this verified Perfect XV fact pack:\\n\\n" +
            JSON.stringify(factPack),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1100,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      "AI story request failed (" +
        response.status +
        ")" +
        (detail ? ": " + detail.slice(0, 300) : "")
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  return raw ? parseAiArticle(raw) : null;
}

function buildFallbackArticle(factPack: {
  competition: string;
  round: number;
  matches: Array<{
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    correctResultCount: number;
    exactScoreCount: number;
    predictionCount: number;
  }>;
  roundPerformers: Array<{
    name: string;
    roundPoints: number;
    exactScores: number;
    correctResults: number;
  }>;
  leaderboard: Array<{
    name: string;
    rank: number;
    previousRank: number | null;
    movement: number | null;
    totalPoints: number;
  }>;
  biggestRises: Array<{ name: string; movement: number; rank: number }>;
  biggestFalls: Array<{ name: string; movement: number; rank: number }>;
}) {
  const leader = factPack.leaderboard[0];
  const roundStar = factPack.roundPerformers[0];
  const previousLeader = factPack.leaderboard.find((entry) => entry.previousRank === 1);
  const leadChanged = Boolean(previousLeader && leader && previousLeader.name !== leader.name);

  const headline = leader
    ? leadChanged
      ? leader.name + " takes over at the top after Round " + factPack.round
      : roundStar && roundStar.name !== leader.name
        ? roundStar.name +
          " stars in Round " +
          factPack.round +
          " as " +
          leader.name +
          " stays top"
        : leader.name + " sets the standard in Round " + factPack.round
    : factPack.competition + " Round " + factPack.round + " report";

  const standfirst =
    roundStar && leader
      ? roundStar.name +
        " produced the round's strongest return, while " +
        leader.name +
        " emerged from the round at the head of the Perfect XV standings."
      : "The latest results reshaped the Perfect XV standings as another round of predictions was settled.";

  const matchSentence = factPack.matches
    .map(
      (match) =>
        match.homeTeam +
        " " +
        match.homeScore +
        "-" +
        match.awayScore +
        " " +
        match.awayTeam +
        " (" +
        match.correctResultCount +
        "/" +
        match.predictionCount +
        " predicted the result; " +
        match.exactScoreCount +
        " exact)"
    )
    .join("; ");

  const paragraphs: string[] = [];
  paragraphs.push(
    "Round " +
      factPack.round +
      " of " +
      factPack.competition +
      " delivered another shift in the Perfect XV contest. " +
      (roundStar
        ? roundStar.name +
          " led the scoring for the round with " +
          roundStar.roundPoints +
          " points" +
          (roundStar.exactScores
            ? ", helped by " +
              roundStar.exactScores +
              (roundStar.exactScores === 1 ? " exact score" : " exact scores")
            : "") +
          "."
        : "The completed fixtures have now been added to the standings.")
  );

  if (matchSentence) {
    paragraphs.push(
      "The rugby behind the numbers told its own story: " +
        matchSentence +
        ". Those calls separated the field and fed directly into the movement on the table."
    );
  }

  if (leader) {
    const second = factPack.leaderboard[1];
    paragraphs.push(
      leader.name +
        " finishes the round in first place on " +
        leader.totalPoints +
        " points" +
        (second
          ? ", with " +
            second.name +
            " next on " +
            second.totalPoints +
            "."
          : ".") +
        (leadChanged && previousLeader
          ? " That represents a change at the summit, with " +
            previousLeader.name +
            " having held first place before the round."
          : "")
    );
  }

  const rise = factPack.biggestRises[0];
  const fall = factPack.biggestFalls[0];
  if (rise || fall) {
    paragraphs.push(
      [
        rise
          ? rise.name +
            " supplied the biggest climb, moving up " +
            rise.movement +
            " places to " +
            rise.rank +
            "."
          : "",
        fall
          ? fall.name +
            " had the sharpest reverse, dropping " +
            Math.abs(fall.movement) +
            " places to " +
            fall.rank +
            "."
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  paragraphs.push(
    "With Round " +
      factPack.round +
      " now in the books, the table records the damage and the gains. The next set of predictions will decide whether this round's movers can make their progress stick."
  );

  return { headline, standfirst, body: paragraphs.join("\n\n") };
}

export async function generateCompletedRoundStory(
  tournamentId: number,
  round: number
): Promise<StoryPayload | null> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      year: true,
      matches: {
        where: { round: { lte: round } },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        select: {
          id: true,
          round: true,
          matchNumber: true,
          completed: true,
          actualHomeScore: true,
          actualAwayScore: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  });

  if (!tournament) return null;

  const targetMatches = tournament.matches.filter((match) => match.round === round);
  if (targetMatches.length === 0 || targetMatches.some((match) => !match.completed)) return null;
  if (
    targetMatches.some(
      (match) => match.actualHomeScore === null || match.actualAwayScore === null
    )
  ) {
    return null;
  }

  const entries = await prisma.competitionEntry.findMany({
    where: { tournamentId, status: "ENTERED" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (entries.length === 0) return null;

  const completedMatches = tournament.matches.filter((match) => match.completed);
  const completedMatchIds = completedMatches.map((match) => match.id);
  const predictions = await prisma.prediction.findMany({
    where: {
      matchId: { in: completedMatchIds },
      userId: { in: entries.map((entry) => entry.userId) },
    },
    select: {
      userId: true,
      matchId: true,
      pointsAwarded: true,
      exactScore: true,
      correctMargin: true,
      correctResult: true,
      differenceScore: true,
    },
  });

  const currentMatchIds = new Set(
    completedMatches.filter((match) => match.round <= round).map((match) => match.id)
  );
  const previousMatchIds = new Set(
    completedMatches.filter((match) => match.round < round).map((match) => match.id)
  );
  const roundMatchIds = new Set(targetMatches.map((match) => match.id));

  const currentRankings = buildRankings(entries, predictions, currentMatchIds);
  const previousRankings =
    previousMatchIds.size > 0
      ? buildRankings(entries, predictions, previousMatchIds)
      : [];
  const roundRankings = buildRankings(entries, predictions, roundMatchIds);

  const previousByUser = new Map(previousRankings.map((entry) => [entry.id, entry]));
  const leaderboard = currentRankings.map((entry) => {
    const previous = previousByUser.get(entry.id);
    const movement = previous ? previous.rank - entry.rank : null;

    return {
      name: entry.name,
      rank: entry.rank,
      previousRank: previous?.rank ?? null,
      movement,
      movementLabel: movementLabel(movement),
      totalPoints: entry.totalPoints,
      exactScores: entry.exactScores,
      correctMargins: entry.correctMargins,
      correctResults: entry.correctResults,
      predictionDelta: entry.differenceScore,
    };
  });

  const roundPerformers = roundRankings.map((entry) => ({
    name: entry.name,
    roundRank: entry.rank,
    roundPoints: entry.totalPoints,
    exactScores: entry.exactScores,
    correctMargins: entry.correctMargins,
    correctResults: entry.correctResults,
    predictionDelta: entry.differenceScore,
  }));

  const movementRows = leaderboard.flatMap((entry) =>
    entry.movement === null ? [] : [{ ...entry, movement: entry.movement }]
  );
  const biggestRises = [...movementRows]
    .filter((entry) => entry.movement > 0)
    .sort((a, b) => b.movement - a.movement || a.rank - b.rank)
    .slice(0, 5)
    .map(({ name, movement, rank }) => ({ name, movement, rank }));
  const biggestFalls = [...movementRows]
    .filter((entry) => entry.movement < 0)
    .sort((a, b) => a.movement - b.movement || a.rank - b.rank)
    .slice(0, 5)
    .map(({ name, movement, rank }) => ({ name, movement, rank }));

  const roundMatches = targetMatches.map((match) => {
    const matchPredictions = predictions.filter(
      (prediction) => prediction.matchId === match.id
    );

    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.actualHomeScore as number,
      awayScore: match.actualAwayScore as number,
      predictionCount: matchPredictions.length,
      correctResultCount: matchPredictions.filter(
        (prediction) => prediction.correctResult
      ).length,
      exactScoreCount: matchPredictions.filter(
        (prediction) => prediction.exactScore
      ).length,
    };
  });

  const title = formatCompetitionTitle(tournament.name, tournament.year);
  const factPack = {
    competition: title,
    round,
    entrantCount: entries.length,
    matches: roundMatches,
    leaderboard: leaderboard.slice(0, 10),
    roundPerformers: roundPerformers.slice(0, 10),
    biggestRises,
    biggestFalls,
    exactScorePerformers: roundPerformers
      .filter((entry) => entry.exactScores > 0)
      .slice(0, 8),
    notes: {
      movement:
        "Positive movement means places gained since the end of the previous completed round.",
      predictionDelta:
        "Prediction Delta is supplied only as a verified tie-break/statistical fact; do not reinterpret its formula.",
    },
  };

  let article: { headline: string; standfirst: string; body: string } | null = null;
  let generation: StoryPayload["generation"] = "fallback";

  try {
    article = await writeAiArticle(factPack);
    if (article) generation = "ai";
  } catch (error) {
    console.error("AI competition story generation failed", error);
  }

  if (!article) article = buildFallbackArticle(factPack);

  const payload: StoryPayload = {
    tournamentId,
    round,
    headline: article.headline,
    standfirst: article.standfirst,
    body: article.body,
    generatedAt: new Date().toISOString(),
    version: STORY_VERSION,
    generation,
  };

  await prisma.systemSetting.upsert({
    where: { key: COMPETITION_STORY_PREFIX + tournamentId + "_" + round },
    update: { value: JSON.stringify(payload) },
    create: {
      key: COMPETITION_STORY_PREFIX + tournamentId + "_" + round,
      value: JSON.stringify(payload),
    },
  });

  return payload;
}

function shouldRefreshStory(story: StoryPayload) {
  if ((story.version ?? 0) < STORY_VERSION) return true;
  if (story.generation === "ai") return false;

  const generatedAt = Date.parse(story.generatedAt);
  return (
    !Number.isFinite(generatedAt) ||
    Date.now() - generatedAt >= FALLBACK_RETRY_MS
  );
}

export async function listCompetitionStories() {
  let settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: COMPETITION_STORY_PREFIX } },
    orderBy: { updatedAt: "desc" },
  });

  const parsed = settings.flatMap((setting) => {
    try {
      return [JSON.parse(setting.value) as StoryPayload];
    } catch {
      return [];
    }
  });

  const refresh = parsed.filter(shouldRefreshStory);
  if (refresh.length > 0) {
    await Promise.all(
      refresh.map((story) =>
        generateCompletedRoundStory(story.tournamentId, story.round).catch(
          (error) => {
            console.error("Competition story refresh failed", error);
            return null;
          }
        )
      )
    );

    settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: COMPETITION_STORY_PREFIX } },
      orderBy: { updatedAt: "desc" },
    });
  }

  return settings
    .flatMap((setting) => {
      try {
        return [JSON.parse(setting.value) as StoryPayload];
      } catch {
        return [];
      }
    })
    .sort((a, b) =>
      a.tournamentId === b.tournamentId
        ? b.round - a.round
        : Date.parse(b.generatedAt) - Date.parse(a.generatedAt)
    );
}
