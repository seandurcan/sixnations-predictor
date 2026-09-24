import { prisma } from "@/lib/prisma";
import { formatCompetitionTitle } from "@/lib/competitionTitle";

export const COMPETITION_STORY_PREFIX = "COMPETITION_STORY_";

type StoryPayload = {
  tournamentId: number;
  round: number;
  headline: string;
  body: string;
  generatedAt: string;
};

function entrantName(entry: { user: { firstName: string; lastName: string } }) {
  return `${entry.user.firstName} ${entry.user.lastName}`.trim();
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
        where: { round },
        select: { id: true, completed: true },
      },
    },
  });
  if (!tournament || tournament.matches.length === 0) return null;
  if (tournament.matches.some((match) => !match.completed)) return null;

  const matchIds = tournament.matches.map((match) => match.id);
  const entries = await prisma.competitionEntry.findMany({
    where: { tournamentId, status: "ENTERED" },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (entries.length === 0) return null;

  const predictions = await prisma.prediction.findMany({
    where: { matchId: { in: matchIds }, userId: { in: entries.map((entry) => entry.userId) } },
    select: {
      userId: true,
      pointsAwarded: true,
      exactScore: true,
      correctResult: true,
    },
  });

  const roundStats = entries.map((entry) => {
    const own = predictions.filter((prediction) => prediction.userId === entry.userId);
    return {
      entry,
      roundPoints: own.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0),
      exactScores: own.filter((prediction) => prediction.exactScore).length,
      correctResults: own.filter((prediction) => prediction.correctResult).length,
    };
  }).sort(
    (a, b) =>
      b.roundPoints - a.roundPoints ||
      b.exactScores - a.exactScores ||
      b.correctResults - a.correctResults ||
      entrantName(a.entry).localeCompare(entrantName(b.entry))
  );

  const standings = [...entries].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.exactScores - a.exactScores ||
      a.cumulativeError - b.cumulativeError ||
      entrantName(a).localeCompare(entrantName(b))
  );

  const roundLeader = roundStats[0];
  const overallLeader = standings[0];
  const title = formatCompetitionTitle(tournament.name, tournament.year);
  const exactPhrase = roundLeader.exactScores === 1
    ? "including one exact score"
    : roundLeader.exactScores > 1
      ? `including ${roundLeader.exactScores} exact scores`
      : "without needing an exact-score bonus";

  const headline = `${entrantName(roundLeader.entry)} sets the pace in ${title} Round ${round}`;
  const body =
    `Round ${round} of ${title} belonged to ${entrantName(roundLeader.entry)}, who collected ${roundLeader.roundPoints} points ${exactPhrase}. ` +
    `The latest results kept the Perfect XV race moving, with every prediction feeding directly into the season standings. ` +
    `At the top of the overall table, ${entrantName(overallLeader)} now leads on ${overallLeader.totalPoints} points, with ${overallLeader.exactScores} exact scores on the record. ` +
    `There is still plenty of rugby to come, and with each completed round capable of reshaping the order, the margin for a careless call is getting smaller.`;

  const payload: StoryPayload = {
    tournamentId,
    round,
    headline,
    body,
    generatedAt: new Date().toISOString(),
  };

  await prisma.systemSetting.upsert({
    where: { key: `${COMPETITION_STORY_PREFIX}${tournamentId}_${round}` },
    update: { value: JSON.stringify(payload) },
    create: {
      key: `${COMPETITION_STORY_PREFIX}${tournamentId}_${round}`,
      value: JSON.stringify(payload),
    },
  });

  return payload;
}

export async function listCompetitionStories() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: COMPETITION_STORY_PREFIX } },
    orderBy: { updatedAt: "desc" },
  });

  return settings.flatMap((setting) => {
    try {
      return [JSON.parse(setting.value) as StoryPayload];
    } catch {
      return [];
    }
  });
}
