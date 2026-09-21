import { describe, expect, it } from "vitest";
import { getFollowingCompetitionYear } from "./competitionYear";

describe("getFollowingCompetitionYear", () => {
  it("uses the year after the current competition", () => {
    expect(
      getFollowingCompetitionYear(
        [
          { id: 1, year: 2027 },
          { id: 2, year: 2028 },
        ],
        1,
        2026
      )
    ).toBe(2028);
  });

  it("falls back to the year after the calendar year when there is no current competition", () => {
    expect(getFollowingCompetitionYear([], null, 2026)).toBe(2027);
  });
});
