import { describe, expect, it } from "vitest";
import {
  assignCompetitionRanks,
  calculateMatchScore,
  compareLeaderboardEntries,
} from "./scoring";

describe("calculateMatchScore", () => {
  it("awards 8 points for an exact score", () => {
    expect(calculateMatchScore(24, 17, 24, 17).pointsAwarded).toBe(8);
  });

  it("awards 5 points for the right result and margin", () => {
    expect(calculateMatchScore(20, 13, 24, 17).pointsAwarded).toBe(5);
  });

  it("awards 3 points for only the right result", () => {
    expect(calculateMatchScore(18, 10, 24, 17).pointsAwarded).toBe(3);
  });

  it("awards no points for an incorrect result", () => {
    expect(calculateMatchScore(10, 18, 24, 17).pointsAwarded).toBe(0);
  });
});

describe("compareLeaderboardEntries", () => {
  const base = {
    id: 1,
    totalPoints: 20,
    cumulativeError: 12,
    exactScores: 1,
    correctMargins: 2,
    correctResults: 5,
  };

  it("uses aggregate score error before the remaining ranking measures", () => {
    const better = { ...base, id: 2, cumulativeError: 8 };
    expect([base, better].sort(compareLeaderboardEntries)[0].id).toBe(2);
  });

  it.each([
    ["exact scores", { exactScores: 2 }],
    ["correct winning margins", { correctMargins: 3 }],
    ["correct results", { correctResults: 6 }],
  ])("uses %s in the agreed order", (_label, improvement) => {
    const better = { ...base, id: 2, ...improvement };
    expect([base, better].sort(compareLeaderboardEntries)[0].id).toBe(2);
  });

  it("does not use entrant ID or registration order to split a complete tie", () => {
    const other = { ...base, id: 999 };
    expect(compareLeaderboardEntries(base, other)).toBe(0);
  });

  it("preserves joint winners and competition ranking", () => {
    const jointWinner = { ...base, id: 2 };
    const third = { ...base, id: 3, totalPoints: 19 };
    expect(assignCompetitionRanks([base, jointWinner, third]).map((entry) => entry.rank))
      .toEqual([1, 1, 3]);
  });
});
