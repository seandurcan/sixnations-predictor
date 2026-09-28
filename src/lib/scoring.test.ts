import { describe, expect, it } from "vitest";
import {
  assignCompetitionRanks,
  calculateMatchScore,
  compareLeaderboardEntries,
} from "./scoring";

describe("calculateMatchScore", () => {
  it("awards 6 points for an exact score", () => {
    const score = calculateMatchScore(24, 17, 24, 17);

    expect(score.pointsAwarded).toBe(6);
    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(true);
  });

  it("awards 3 points for a correct result and exact margin", () => {
    const score = calculateMatchScore(20, 13, 24, 17);

    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(false);
    expect(score.pointsAwarded).toBe(3);
  });

  it("awards 0 for an incorrect result", () => {
    expect(calculateMatchScore(10, 18, 24, 17).pointsAwarded).toBe(0);
  });

  it("awards 3 points for a correctly predicted draw without an exact score", () => {
    const score = calculateMatchScore(20, 20, 17, 17);

    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(false);
    expect(score.pointsAwarded).toBe(3);
  });

  it("calculates aggregate score error from both teams", () => {
    expect(calculateMatchScore(24, 18, 27, 16).errorValue).toBe(5);
  });

  it("makes Prediction Delta negative when the predicted result is correct", () => {
    expect(calculateMatchScore(31, 10, 27, 20).differenceScore).toBe(-14);
  });

  it("makes Prediction Delta positive when the predicted result is wrong", () => {
    expect(calculateMatchScore(10, 31, 27, 20).differenceScore).toBe(14);
  });
});

describe("leaderboard ranking", () => {
  const base = {
    id: 1,
    totalPoints: 20,
    cumulativeError: 30,
    differenceScore: 4,
    exactScores: 2,
    correctMargins: 3,
    correctResults: 5,
    tournamentPointsGuessError: 12,
  };

  it.each([
    ["total points", { totalPoints: 21 }],
    ["lowest cumulative Prediction Delta", { differenceScore: -5 }],
    ["exact scores", { exactScores: 3 }],
    ["correct winning margins", { correctMargins: 4 }],
    ["correct results", { correctResults: 6 }],
  ])("uses %s in the locked order", (_label, improvement) => {
    const better = { ...base, id: 2, ...improvement };

    expect([base, better].sort(compareLeaderboardEntries)[0].id).toBe(2);
  });

  it("uses cumulative Prediction Delta ahead of later tie-breaks", () => {
    const better = {
      ...base,
      id: 2,
      differenceScore: -20,
      exactScores: 0,
      correctMargins: 0,
      correctResults: 0,
    };

    expect([base, better].sort(compareLeaderboardEntries)[0].id).toBe(2);
  });

  it("keeps a complete tie joint with competition ranking", () => {
    const second = { ...base, id: 2 };
    const third = { ...base, id: 3, totalPoints: 19 };

    expect(
      assignCompetitionRanks([base, second, third]).map((entry) => entry.rank)
    ).toEqual([1, 1, 3]);
  });
});

// Product contract recovered from Completed Enhancements List: never redefine it
// to match implementation changes without explicit project-owner approval.
describe('agreed scoring contract', () => {
  it.each([
    [24, 17, 24, 17, 6], [20, 13, 24, 17, 3], [20, 10, 24, 17, 1],
    [10, 20, 24, 17, 0], [17, 24, 17, 24, 6], [20, 20, 17, 17, 3],
    [17, 17, 17, 17, 6], [20, 10, 17, 17, 0],
  ])('prediction %i-%i, result %i-%i awards %i', (ph, pa, ah, aa, points) => {
    expect(calculateMatchScore(ph, pa, ah, aa).pointsAwarded).toBe(points);
  });
  it('always awards only 0, 1, 3 or 6 whole points', () => {
    for (let ph = 0; ph < 12; ph++) for (let pa = 0; pa < 12; pa++) {
      for (let ah = 0; ah < 12; ah++) for (let aa = 0; aa < 12; aa++) {
        expect([0, 1, 3, 6]).toContain(calculateMatchScore(ph, pa, ah, aa).pointsAwarded);
      }
    }
  });
  it('gives lower cumulative Prediction Delta priority over later tie-breaks', () => {
    const a = { id: 1, totalPoints: 12, correctResults: 6, exactScores: 3, correctMargins: 4, cumulativeError: 0, differenceScore: 10 };
    const b = { id: 2, totalPoints: 12, correctResults: 5, exactScores: 0, correctMargins: 0, cumulativeError: 100, differenceScore: -10 };
    expect(compareLeaderboardEntries(b, a)).toBeLessThan(0);
  });
});
