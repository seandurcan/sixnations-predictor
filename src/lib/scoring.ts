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
  const marginDelta = predictedMargin - actualMargin;

  return {
    // Perfect XV scoring:
    // 1 point for the correct match result.
    // 2 bonus points for the correct margin; 3 bonus points for an exact score.
    // Agreed rules: bonuses stack, for a maximum of 6. Do not change without owner approval.
    pointsAwarded:
      (correctResult ? 1 : 0) +
      (correctMargin ? 2 : 0) +
      (exactScore ? 3 : 0),
    exactScore,
    correctMargin,
    correctResult,
    // Aggregate score error is the sum of the absolute home and away score errors.
    errorValue:
      Math.abs(predictedHome - actualHome) +
      Math.abs(predictedAway - actualAway),
    // Signed prediction delta is retained for display/audit only.
    differenceScore: marginDelta,
  };
}

export type RankingEntry = {
  id: number;
  totalPoints: number;
  cumulativeError?: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
  differenceScore?: number;
};

function normalisedError(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : Number.POSITIVE_INFINITY;
}


export function compareLeaderboardEntries(
  a: RankingEntry,
  b: RankingEntry
) {
  return (
    // Locked Perfect XV leaderboard hierarchy:
    // 1 Total points
    // 2 Most correct results
    // 3 Most exact scores
    // 4 Most correct winning margins
    // 5 Lowest aggregate score error
    b.totalPoints - a.totalPoints ||
    b.correctResults - a.correctResults ||
    b.exactScores - a.exactScores ||
    b.correctMargins - a.correctMargins ||
    normalisedError(a.cumulativeError) - normalisedError(b.cumulativeError)
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
