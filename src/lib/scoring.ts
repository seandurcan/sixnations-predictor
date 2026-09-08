export type MatchScore = {
  pointsAwarded: number;
  exactScore: boolean;
  correctMargin: boolean;
  correctResult: boolean;
  errorValue: number;
  differenceScore: number;
};

function outcome(home: number, away: number) {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

export function calculateMatchScore(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): MatchScore {
  const predictedMargin = predictedHome - predictedAway;
  const actualMargin = actualHome - actualAway;
  const correctResult =
    outcome(predictedHome, predictedAway) === outcome(actualHome, actualAway);
  const correctMargin = predictedMargin === actualMargin;
  const exactScore = predictedHome === actualHome && predictedAway === actualAway;
  const marginError = Math.abs(predictedMargin - actualMargin);

  return {
    pointsAwarded:
      (correctResult ? 3 : 0) +
      (correctMargin ? 2 : 0) +
      (exactScore ? 3 : 0),
    exactScore,
    correctMargin,
    correctResult,
    errorValue:
      Math.abs(predictedHome - actualHome) +
      Math.abs(predictedAway - actualAway),
    differenceScore: correctResult ? -marginError : marginError,
  };
}

export type RankingEntry = {
  id: number;
  totalPoints: number;
  cumulativeError: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
  tournamentPointsError: number | null;
};

function nullableError(value: number | null) {
  return value ?? Number.MAX_SAFE_INTEGER;
}

export function compareLeaderboardEntries(a: RankingEntry, b: RankingEntry) {
  return (
    b.totalPoints - a.totalPoints ||
    a.cumulativeError - b.cumulativeError ||
    b.exactScores - a.exactScores ||
    b.correctMargins - a.correctMargins ||
    b.correctResults - a.correctResults ||
    nullableError(a.tournamentPointsError) - nullableError(b.tournamentPointsError)
  );
}

export function assignCompetitionRanks<T extends RankingEntry>(entries: T[]) {
  const sorted = [...entries].sort(compareLeaderboardEntries);
  let currentRank = 1;

  return sorted.map((entry, index) => {
    if (index > 0 && compareLeaderboardEntries(sorted[index - 1], entry) !== 0) {
      currentRank = index + 1;
    }

    return { ...entry, rank: currentRank };
  });
}
