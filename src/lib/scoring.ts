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
    outcome(predictedHome, predictedAway) ===
    outcome(actualHome, actualAway);
  const correctMargin =
    correctResult &&
    predictedMargin === actualMargin;
  const exactScore =
    predictedHome === actualHome &&
    predictedAway === actualAway;
  const marginError =
    Math.abs(predictedMargin - actualMargin);

  return {
    // Locked rule: 1 point for a correct result
    // plus 3 bonus points for an exact score.
    pointsAwarded:
      (correctResult ? 1 : 0) +
      (exactScore ? 3 : 0),
    exactScore,
    correctMargin,
    correctResult,
    errorValue:
      Math.abs(predictedHome - actualHome) +
      Math.abs(predictedAway - actualAway),
    differenceScore:
      correctResult ? -marginError : marginError,
  };
}

export type RankingEntry = {
  id: number;
  totalPoints: number;
  cumulativeError: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
};

export function compareLeaderboardEntries(
  a: RankingEntry,
  b: RankingEntry
) {
  return (
    // Locked Perfect XV ranking order:
    // 1 Total Points
    // 2 Correct Results
    // 3 Exact Scores
    // 4 Correct Winning Margins
    // 5 Lowest Aggregate Score Error
    b.totalPoints - a.totalPoints ||
    b.correctResults - a.correctResults ||
    b.exactScores - a.exactScores ||
    b.correctMargins - a.correctMargins ||
    a.cumulativeError - b.cumulativeError
  );
}

export function assignCompetitionRanks<
  T extends RankingEntry
>(entries: T[]) {
  const sorted =
    [...entries].sort(compareLeaderboardEntries);

  let currentRank = 1;

  return sorted.map((entry, index) => {
    if (
      index > 0 &&
      compareLeaderboardEntries(
        sorted[index - 1],
        entry
      ) !== 0
    ) {
      currentRank = index + 1;
    }

    return {
      ...entry,
      rank: currentRank,
    };
  });
}