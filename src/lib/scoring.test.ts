import {
  describe,
  expect,
  it,
} from "vitest";
import {
  assignCompetitionRanks,
  calculateMatchScore,
  compareLeaderboardEntries,
} from "./scoring";

describe("calculateMatchScore", () => {
  it("awards 6 points for an exact score", () => {
    const score =
      calculateMatchScore(
        24,
        17,
        24,
        17
      );

    expect(score.pointsAwarded).toBe(6);
    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(true);
  });

  it("awards 3 points for a correct result with the exact winning margin", () => {
    expect(
      calculateMatchScore(
        20,
        13,
        24,
        17
      ).pointsAwarded
    ).toBe(3);
  });

  it("awards 2 bonus points for an exact winning margin", () => {
    const score =
      calculateMatchScore(
        20,
        13,
        24,
        17
      );

    expect(score.correctMargin).toBe(true);
    expect(score.pointsAwarded).toBe(3);
  });

  it("awards 0 for an incorrect result", () => {
    expect(
      calculateMatchScore(
        10,
        18,
        24,
        17
      ).pointsAwarded
    ).toBe(0);
  });

  it("treats a correctly predicted draw as winning margin zero", () => {
    const score =
      calculateMatchScore(
        20,
        20,
        17,
        17
      );

    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(false);
    expect(score.pointsAwarded).toBe(3);
  });

  it("calculates aggregate score error from both teams", () => {
    expect(
      calculateMatchScore(
        24,
        18,
        27,
        16
      ).errorValue
    ).toBe(5);
  });
});

describe("leaderboard ranking", () => {
  const base = {
    id: 1,
    totalPoints: 20,
    correctResults: 5,
    exactScores: 2,
    correctMargins: 3,
    cumulativeError: 12,
  };

  it.each([
    [
      "total points",
      { totalPoints: 21 },
    ],
    [
      "correct results",
      { correctResults: 6 },
    ],
    [
      "exact scores",
      { exactScores: 3 },
    ],
    [
      "correct winning margins",
      { correctMargins: 4 },
    ],
    [
      "aggregate score error",
      { cumulativeError: 11 },
    ],
  ])(
    "uses %s in the locked order",
    (_label, improvement) => {
      const better = {
        ...base,
        id: 2,
        ...improvement,
      };

      expect(
        [base, better]
          .sort(compareLeaderboardEntries)[0]
          .id
      ).toBe(2);
    }
  );

  it("keeps a complete tie joint with competition ranking", () => {
    const second = {
      ...base,
      id: 2,
    };

    const third = {
      ...base,
      id: 3,
      totalPoints: 19,
    };

    expect(
      assignCompetitionRanks([
        base,
        second,
        third,
      ]).map((entry) => entry.rank)
    ).toEqual([1, 1, 3]);
  });
});