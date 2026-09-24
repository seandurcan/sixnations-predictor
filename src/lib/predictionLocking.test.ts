import { describe, expect, it } from "vitest";
import {
  fixturePredictionIsLocked,
  fixturePredictionLockAt,
  predictionLockMode,
} from "./predictionLocking";

describe("competition-aware prediction locking", () => {
  it("preserves tournament-wide locking for Six Nations", () => {
    expect(predictionLockMode("Six Nations Championship")).toBe("TOURNAMENT");
    expect(
      fixturePredictionLockAt({
        competitionName: "Six Nations Championship",
        tournamentPredictionLockAt: "2027-02-05T20:09:00.000Z",
        kickoffTime: "2027-03-13T20:10:00.000Z",
      })?.toISOString()
    ).toBe("2027-02-05T20:09:00.000Z");
  });

  it("uses one minute before each URC fixture", () => {
    expect(predictionLockMode("United Rugby Championship")).toBe("MATCH");
    expect(
      fixturePredictionLockAt({
        competitionName: "United Rugby Championship",
        tournamentPredictionLockAt: "2026-09-25T18:59:00.000Z",
        kickoffTime: "2027-01-02T19:35:00.000Z",
      })?.toISOString()
    ).toBe("2027-01-02T19:34:00.000Z");
  });

  it("only locks a generic fixture after its own deadline", () => {
    const input = {
      competitionName: "United Rugby Championship",
      kickoffTime: "2026-10-03T15:00:00.000Z",
    };
    expect(fixturePredictionIsLocked(input, new Date("2026-10-03T14:58:59.000Z"))).toBe(false);
    expect(fixturePredictionIsLocked(input, new Date("2026-10-03T14:59:00.000Z"))).toBe(true);
  });
});
