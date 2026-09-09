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
  const correctMargin = correctResult && predictedMargin === actualMargin;
  const exactScore = predictedHome === actualHome && predictedAway === actualAway;
  const marginError = Math.abs(predictedMargin - actualMargin);

  return {
    // Locked rule: 1 point for the correct result + 3 bonus for an exact score.
    pointsAwarded: (correctResult ? 1 : 0) + (exactScore ? 3 : 0),
    exactScore,
    correctMargin,
    correctResult,
    errorValue:
      Math.abs(predictedHome - actualHome) +
      Math.abs(predictedAway - actualAway),
    differenceScore: correctResult ? -marginError : marginError,
  };
}

export function calculateTournamentPointsError(
  guess: number | null | undefined,
  actualTournamentPoints: number | null,
  tournamentComplete: boolean
) {
  // The final tournament-points prediction must not affect live/interim ranks.
  if (!tournamentComplete || actualTournamentPoints === null) return 0;
  // An entrant with no tournament-total prediction cannot beat an entrant who supplied one.
  if (guess === null || guess === undefined) return Number.MAX_SAFE_INTEGER;
  return Math.abs(guess - actualTournamentPoints);
}

export type RankingEntry = {
  id: number;
  totalPoints: number;
  cumulativeError: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
  tournamentPointsError?: number;
};

export function compareLeaderboardEntries(a: RankingEntry, b: RankingEntry) {
  return (
    // Locked Perfect XV ranking order:
    // 1 Total Points
    // 2 Correct Results
    // 3 Exact Scores
    // 4 Correct Winning Margins
    // 5 Lowest Aggregate Score Error
    // 6 Closest Total Tournament Points Prediction
    b.totalPoints - a.totalPoints ||
    b.correctResults - a.correctResults ||
    b.exactScores - a.exactScores ||
    b.correctMargins - a.correctMargins ||
    a.cumulativeError - b.cumulativeError ||
    (a.tournamentPointsError ?? 0) - (b.tournamentPointsError ?? 0)
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
