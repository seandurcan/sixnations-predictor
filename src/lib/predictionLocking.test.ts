import { describe, expect, it } from "vitest";
import {
  fixturePredictionIsLocked,
  fixturePredictionLockAt,
  predictionLockMode,
  predictionStageKey,
} from "./predictionLocking";

describe("stage-based prediction locking", () => {
  it("preserves tournament-wide locking for Six Nations and derives it from the first fixture", () => {
    expect(predictionLockMode("Six Nations Championship")).toBe("TOURNAMENT");
    const fixtures = [
      { round: 1, kickoffTime: "2027-02-05T20:10:00.000Z" },
      { round: 5, kickoffTime: "2027-03-13T20:10:00.000Z" },
    ];

    expect(
      fixturePredictionLockAt({
        competitionName: "Six Nations Championship",
        tournamentPredictionLockAt: "2027-02-05T20:10:00.000Z",
        kickoffTime: fixtures[1].kickoffTime,
        matchRound: 5,
        tournamentMatches: fixtures,
      })?.toISOString()
    ).toBe("2027-02-05T20:09:00.000Z");
  });

  it("locks the whole URC regular season one minute before its first fixture", () => {
    expect(predictionLockMode("United Rugby Championship")).toBe("STAGE");
    expect(predictionStageKey("United Rugby Championship", 12)).toBe("REGULAR_SEASON");

    const fixtures = [
      { round: 1, kickoffTime: "2026-09-25T19:00:00.000Z" },
      { round: 12, kickoffTime: "2027-01-02T19:35:00.000Z" },
      { round: 18, kickoffTime: "2027-05-01T18:00:00.000Z" },
    ];

    expect(
      fixturePredictionLockAt({
        competitionName: "United Rugby Championship",
        kickoffTime: fixtures[1].kickoffTime,
        matchRound: fixtures[1].round,
        tournamentMatches: fixtures,
      })?.toISOString()
    ).toBe("2026-09-25T18:59:00.000Z");
  });

  it("gives a later URC knockout round its own stage deadline", () => {
    const fixtures = [
      { round: 18, kickoffTime: "2027-05-01T18:00:00.000Z" },
      { round: 19, kickoffTime: "2027-05-08T17:30:00.000Z" },
      { round: 19, kickoffTime: "2027-05-09T15:00:00.000Z" },
    ];

    expect(predictionStageKey("United Rugby Championship", 19)).toBe("ROUND_19");
    expect(
      fixturePredictionLockAt({
        competitionName: "United Rugby Championship",
        kickoffTime: fixtures[2].kickoffTime,
        matchRound: 19,
        tournamentMatches: fixtures,
      })?.toISOString()
    ).toBe("2027-05-08T17:29:00.000Z");
  });

  it("locks the Challenge Cup pool stage together", () => {
    const fixtures = [
      { round: 1, kickoffTime: "2026-12-04T19:00:00.000Z" },
      { round: 4, kickoffTime: "2027-01-17T13:00:00.000Z" },
    ];

    expect(predictionStageKey("EPCR Challenge Cup", 4)).toBe("POOL_STAGE");
    expect(
      fixturePredictionLockAt({
        competitionName: "EPCR Challenge Cup",
        kickoffTime: fixtures[1].kickoffTime,
        matchRound: 4,
        tournamentMatches: fixtures,
      })?.toISOString()
    ).toBe("2026-12-04T18:59:00.000Z");
  });

  it("does not silently revert an unknown competition to match-by-match locking", () => {
    const fixtures = [
      { round: 1, kickoffTime: "2027-01-01T12:00:00.000Z" },
      { round: 5, kickoffTime: "2027-03-01T12:00:00.000Z" },
    ];

    const input = {
      competitionName: "New Rugby Competition",
      kickoffTime: fixtures[1].kickoffTime,
      matchRound: 5,
      tournamentMatches: fixtures,
    };

    expect(fixturePredictionIsLocked(input, new Date("2027-01-01T11:58:59.000Z"))).toBe(false);
    expect(fixturePredictionIsLocked(input, new Date("2027-01-01T11:59:00.000Z"))).toBe(true);
  });
});
