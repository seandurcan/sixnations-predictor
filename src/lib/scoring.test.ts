import { describe, expect, it } from "vitest";
import {
  assignCompetitionRanks,
  calculateMatchScore,
  compareLeaderboardEntries,
} from "./scoring";

describe("calculateMatchScore", () => {
  it("awards 1.5 points for an exact score", () => {
    const score = calculateMatchScore(24, 17, 24, 17);

    expect(score.pointsAwarded).toBe(1.5);
    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(true);
  });

  it("awards 1 point for a correct result even when the margin is exact", () => {
    const score = calculateMatchScore(20, 13, 24, 17);

    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(false);
    expect(score.pointsAwarded).toBe(1);
  });

  it("awards 0 for an incorrect result", () => {
    expect(calculateMatchScore(10, 18, 24, 17).pointsAwarded).toBe(0);
  });

  it("awards 1 point for a correctly predicted draw without an exact score", () => {
    const score = calculateMatchScore(20, 20, 17, 17);

    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(false);
    expect(score.pointsAwarded).toBe(1);
  });

  it("calculates aggregate score error from both teams", () => {
    expect(calculateMatchScore(24, 18, 27, 16).errorValue).toBe(5);
  });

  it("keeps signed prediction delta for display only", () => {
    expect(calculateMatchScore(31, 10, 27, 20).differenceScore).toBe(14);
  });
});

describe("leaderboard ranking", () => {
  const base = {
    id: 1,
    totalPoints: 20,
    cumulativeError: 30,
    exactScores: 2,
    correctMargins: 3,
    correctResults: 5,
    tournamentPointsGuessError: 12,
  };

  it.each([
    ["total points", { totalPoints: 21 }],
    ["lowest aggregate score error", { cumulativeError: 29 }],
    ["exact scores", { exactScores: 3 }],
    ["correct winning margins", { correctMargins: 4 }],
    ["correct results", { correctResults: 6 }],
    ["total-points guess", { tournamentPointsGuessError: 11 }],
  ])("uses %s in the locked order", (_label, improvement) => {
    const better = { ...base, id: 2, ...improvement };

    expect([base, better].sort(compareLeaderboardEntries)[0].id).toBe(2);
  });

  it("does not use signed prediction delta as a ranking criterion", () => {
    const second = {
      ...base,
      id: 2,
      differenceScore: -999,
    };
    const first = {
      ...base,
      differenceScore: 999,
    };

    expect(compareLeaderboardEntries(first, second)).toBe(0);
  });

  it("keeps a complete tie joint with competition ranking", () => {
    const second = { ...base, id: 2 };
    const third = { ...base, id: 3, totalPoints: 19 };

    expect(
      assignCompetitionRanks([base, second, third]).map((entry) => entry.rank)
    ).toEqual([1, 1, 3]);
  });
});
