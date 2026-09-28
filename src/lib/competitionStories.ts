import { prisma } from "@/lib/prisma";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { assignCompetitionRanks } from "@/lib/scoring";
import { headers } from "next/headers";

export const COMPETITION_STORY_PREFIX = "COMPETITION_STORY_";

const STORY_VERSION = 4;
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
    const body = parsed.body.trim().replace(/\\n\\n/g, "\n\n");

    if (headline.length < 8 || standfirst.length < 20 || body.length < 180) return null;
    return { headline, standfirst, body };
  } catch {
    return null;
  }
}

function articleQualityIssues(article: {
  headline: string;
  standfirst: string;
  body: string;
}) {
  const issues: string[] = [];
  const paragraphs = article.body.split(/\n{2,}/).filter(Boolean);
  const words = article.body.trim().split(/\s+/).filter(Boolean);
  const numericTokens = article.body.match(/\b\d+(?:[.-]\d+)?(?:\/\d+)?\b/g) ?? [];
  const parentheticalPredictionDumps =
    article.body.match(/\(\d+\/\d+[^)]*(?:predict|exact)[^)]*\)/gi) ?? [];
  const semicolons = article.body.match(/;/g) ?? [];

  if (paragraphs.length < 4) {
    issues.push("Use at least four genuine paragraphs.");
  }
  if (parentheticalPredictionDumps.length > 1) {
    issues.push(
      "Do not list several fixtures as parenthetical prediction statistics. Select the meaningful result and explain why it mattered."
    );
  }
  if (semicolons.length > 2) {
    issues.push("Avoid semicolon-separated statistic lists.");
  }
  if (words.length > 0 && numericTokens.length / words.length > 0.09) {
    issues.push("The article is too number-heavy. Keep only statistics that advance the story.");
  }

  const mechanicalPhrases = [
    "the rugby behind the numbers told its own story",
    "those calls separated the field",
    "the latest results kept the perfect xv race moving",
    "there is still plenty of rugby to come",
    "the race is heating up",
  ];
  for (const phrase of mechanicalPhrases) {
    if (article.body.toLowerCase().includes(phrase)) {
      issues.push('Avoid mechanical or generic filler such as "' + phrase + '".');
    }
  }

  return issues;
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
    "Your first job is editorial judgement. Decide what is genuinely newsworthy from the supplied editorial brief and verified fact pack before you start writing.",
    "Write a lively round report about the prediction competition, not a database summary or a statistical roundup.",
    "Lead with the strongest development: for example a change of leader, a standout round, a difficult result that caught most entrants, an exact-score achievement, a dramatic rise or fall, or a very tight battle at the top.",
    "Use natural British/Irish English, strong narrative flow, human warmth, tension and restrained humour where the facts support it.",
    "Entrants are the characters in the story, but never invent emotions, motives, rivalries, relationships, nicknames, incidents or quotations.",
    "Select statistics; do not recite them. Every number included should help explain why something mattered.",
    "Do not mechanically mention every fixture. If several matches produced similar statistics, focus on the most significant one and summarise the rest naturally.",
    "Never write a chain such as '(17/41 predicted...); (22/41 predicted...); (20/41 predicted...)'. Avoid semicolon-separated or bracket-heavy stat dumps.",
    "Explain consequences: connect the important rugby result or prediction performance to what changed for entrants and the leaderboard.",
    "Do not use generic filler such as 'the race is heating up', 'plenty of rugby to come', or 'those calls separated the field' unless a specific supplied fact immediately justifies the point.",
    "Do not explain scoring rules unless they are directly relevant to a notable event.",
    "Aim for 350-500 words in 5-7 short paragraphs.",
    "Return JSON only with exactly three string fields: headline, standfirst, body.",
    "The body must use real paragraph breaks and no Markdown."
  ].join(" ");

  let qualityFeedback = "";

  for (let attempt = 0; attempt < 2; attempt++) {
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
              "Write the round report using only this verified Perfect XV material. " +
              "The editorialBrief has already identified the potentially newsworthy angles; use editorial judgement rather than trying to mention everything.\n\n" +
              JSON.stringify(factPack) +
              (qualityFeedback
                ? "\n\nThe previous draft was rejected by the News Desk. Rewrite it and fix these problems: " +
                  qualityFeedback
                : ""),
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1200,
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
    const article = raw ? parseAiArticle(raw) : null;
    if (!article) {
      qualityFeedback =
        "Return valid JSON with a substantial headline, standfirst and 350-500 word body.";
      continue;
    }

    const issues = articleQualityIssues(article);
    if (issues.length === 0) return article;

    qualityFeedback = issues.join(" ");
    console.warn(
      "AI competition story draft rejected by editorial quality gate",
      qualityFeedback
    );
  }

  return null;
}

function buildFallbackArticle(factPack: {
  competition: string;
  round: number;
  editorialBrief: {
    primaryAngles: string[];
    hardestResult: {
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
      correctResultCount: number;
      predictionCount: number;
    } | null;
    exactScoreCount: number;
    leadChanged: boolean;
    previousLeaderName: string | null;
    currentLeaderName: string | null;
    topGap: number | null;
  };
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
  const second = factPack.leaderboard[1];
  const roundStar = factPack.roundPerformers[0];
  const hardest = factPack.editorialBrief.hardestResult;
  const previousLeader = factPack.editorialBrief.previousLeaderName;

  const headline = factPack.editorialBrief.leadChanged && leader
    ? leader.name + " takes over at the top after Round " + factPack.round
    : roundStar && leader && roundStar.name !== leader.name
      ? roundStar.name + " makes the biggest impression in Round " + factPack.round
      : leader
        ? leader.name + " holds the lead after Round " + factPack.round
        : factPack.competition + " Round " + factPack.round + " report";

  const standfirst =
    factPack.editorialBrief.primaryAngles[0] ??
    "The latest completed round brought a fresh set of gains and setbacks in the Perfect XV standings.";

  const paragraphs: string[] = [];

  if (roundStar) {
    paragraphs.push(
      roundStar.name +
        " emerged as the standout performer of Round " +
        factPack.round +
        ", collecting " +
        roundStar.roundPoints +
        " points" +
        (roundStar.exactScores > 0
          ? " and landing " +
            roundStar.exactScores +
            (roundStar.exactScores === 1 ? " exact score." : " exact scores.")
          : ".")
    );
  }

  if (hardest) {
    const missed = Math.max(0, hardest.predictionCount - hardest.correctResultCount);
    paragraphs.push(
      hardest.homeTeam +
        " " +
        hardest.homeScore +
        "-" +
        hardest.awayScore +
        " " +
        hardest.awayTeam +
        " proved the round's biggest obstacle for the field. Only " +
        hardest.correctResultCount +
        " of " +
        hardest.predictionCount +
        " entrants called the outcome correctly, leaving " +
        missed +
        " on the wrong side of the result."
    );
  }

  if (factPack.editorialBrief.exactScoreCount === 0) {
    paragraphs.push(
      "There were no exact scores anywhere in the round, so the advantage came from identifying the right outcomes and margins rather than finding a perfect scoreline."
    );
  } else {
    paragraphs.push(
      "Exact scores were scarce enough to matter, with " +
        factPack.editorialBrief.exactScoreCount +
        " recorded across the round."
    );
  }

  if (leader) {
    paragraphs.push(
      factPack.editorialBrief.leadChanged && previousLeader
        ? leader.name +
            " now leads the competition on " +
            leader.totalPoints +
            " points, replacing " +
            previousLeader +
            " at the top."
        : leader.name +
            " remains at the head of the standings on " +
            leader.totalPoints +
            " points" +
            (second
              ? ", with " +
                second.name +
                " next on " +
                second.totalPoints +
                "."
              : ".")
    );
  }

  const rise = factPack.biggestRises[0];
  const fall = factPack.biggestFalls[0];
  if (rise || fall) {
    const movementLines: string[] = [];
    if (rise) {
      movementLines.push(
        rise.name +
          " made the round's biggest climb, gaining " +
          rise.movement +
          " places to reach " +
          rise.rank +
          "."
      );
    }
    if (fall) {
      movementLines.push(
        fall.name +
          " experienced the largest fall, slipping " +
          Math.abs(fall.movement) +
          " places to " +
          fall.rank +
          "."
      );
    }
    paragraphs.push(movementLines.join(" "));
  }

  if (factPack.editorialBrief.topGap !== null && factPack.editorialBrief.topGap <= 2) {
    paragraphs.push(
      "The top of the table remains tightly packed, with only " +
        factPack.editorialBrief.topGap +
        (factPack.editorialBrief.topGap === 1 ? " point" : " points") +
        " separating first and second."
    );
  }

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

  const rankedByDifficulty = [...roundMatches]
    .filter((match) => match.predictionCount > 0)
    .sort(
      (a, b) =>
        a.correctResultCount / a.predictionCount -
        b.correctResultCount / b.predictionCount
    );
  const hardestResult = rankedByDifficulty[0] ?? null;
  const easiestResult =
    rankedByDifficulty.length > 0
      ? rankedByDifficulty[rankedByDifficulty.length - 1]
      : null;
  const exactScoreCount = roundMatches.reduce(
    (sum, match) => sum + match.exactScoreCount,
    0
  );
  const currentLeader = leaderboard[0] ?? null;
  const previousLeader = leaderboard.find((entry) => entry.previousRank === 1) ?? null;
  const leadChanged = Boolean(
    currentLeader &&
      previousLeader &&
      currentLeader.name !== previousLeader.name
  );
  const topGap =
    leaderboard.length > 1
      ? leaderboard[0].totalPoints - leaderboard[1].totalPoints
      : null;
  const roundStar = roundPerformers[0] ?? null;
  const primaryAngles: string[] = [];

  if (leadChanged && currentLeader && previousLeader) {
    primaryAngles.push(
      currentLeader.name +
        " took over at the top from " +
        previousLeader.name +
        " after Round " +
        round +
        "."
    );
  }
  if (roundStar) {
    primaryAngles.push(
      roundStar.name +
        " was the strongest performer of the round with " +
        roundStar.roundPoints +
        " points."
    );
  }
  if (hardestResult) {
    primaryAngles.push(
      hardestResult.homeTeam +
        " v " +
        hardestResult.awayTeam +
        " was the hardest result to call: only " +
        hardestResult.correctResultCount +
        " of " +
        hardestResult.predictionCount +
        " entrants predicted the correct outcome."
    );
  }
  if (exactScoreCount === 0) {
    primaryAngles.push("Nobody recorded an exact score in the round.");
  } else {
    primaryAngles.push(
      exactScoreCount +
        (exactScoreCount === 1
          ? " exact score was recorded in the round."
          : " exact scores were recorded in the round.")
    );
  }
  if (biggestRises[0]) {
    primaryAngles.push(
      biggestRises[0].name +
        " made the biggest climb, gaining " +
        biggestRises[0].movement +
        " places."
    );
  }
  if (biggestFalls[0]) {
    primaryAngles.push(
      biggestFalls[0].name +
        " had the biggest fall, dropping " +
        Math.abs(biggestFalls[0].movement) +
        " places."
    );
  }
  if (topGap !== null && topGap <= 2) {
    primaryAngles.push(
      "Only " +
        topGap +
        (topGap === 1 ? " point separates" : " points separate") +
        " first and second."
    );
  }

  const factPack = {
    competition: title,
    round,
    entrantCount: entries.length,
    editorialBrief: {
      primaryAngles,
      hardestResult,
      easiestResult,
      exactScoreCount,
      leadChanged,
      previousLeaderName: previousLeader?.name ?? null,
      currentLeaderName: currentLeader?.name ?? null,
      topGap,
    },
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
