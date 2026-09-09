import { describe, expect, it } from "vitest";
import {
  assignCompetitionRanks,
  calculateMatchScore,
  calculateTournamentPointsError,
  compareLeaderboardEntries,
} from "./scoring";

describe("calculateMatchScore", () => {
  it("awards 4 points for an exact score", () => {
    const score = calculateMatchScore(24, 17, 24, 17);
    expect(score.pointsAwarded).toBe(4);
    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(true);
  });

  it("awards 1 point for a correct result without an exact score", () => {
    expect(calculateMatchScore(20, 13, 24, 17).pointsAwarded).toBe(1);
  });

  it("does not award bonus points for an exact winning margin", () => {
    const score = calculateMatchScore(20, 13, 24, 17);
    expect(score.correctMargin).toBe(true);
    expect(score.pointsAwarded).toBe(1);
  });

  it("awards 0 for an incorrect result", () => {
    expect(calculateMatchScore(10, 18, 24, 17).pointsAwarded).toBe(0);
  });

  it("treats a correctly predicted draw as winning margin zero", () => {
    const score = calculateMatchScore(20, 20, 17, 17);
    expect(score.correctResult).toBe(true);
    expect(score.correctMargin).toBe(true);
    expect(score.exactScore).toBe(false);
    expect(score.pointsAwarded).toBe(1);
  });

  it("calculates aggregate score error from both teams", () => {
    expect(calculateMatchScore(24, 18, 27, 16).errorValue).toBe(5);
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
    tournamentPointsError: 10,
  };

  it.each([
    ["total points", { totalPoints: 21 }],
    ["correct results", { correctResults: 6 }],
    ["exact scores", { exactScores: 3 }],
    ["correct winning margins", { correctMargins: 4 }],
    ["aggregate score error", { cumulativeError: 11 }],
    ["tournament total prediction", { tournamentPointsError: 9 }],
  ])("uses %s in the locked order", (_label, improvement) => {
    const better = { ...base, id: 2, ...improvement };
    expect([base, better].sort(compareLeaderboardEntries)[0].id).toBe(2);
  });

  it("keeps a complete tie joint with competition ranking", () => {
    const second = { ...base, id: 2 };
    const third = { ...base, id: 3, totalPoints: 19 };
    expect(assignCompetitionRanks([base, second, third]).map((x) => x.rank))
      .toEqual([1, 1, 3]);
  });

  it("does not let tournament-total prediction affect interim ranks", () => {
    expect(calculateTournamentPointsError(500, 400, false)).toBe(0);
  });

  it("uses absolute tournament-total error after completion", () => {
    expect(calculateTournamentPointsError(500, 487, true)).toBe(13);
  });
});
