import { describe, expect, it } from "vitest";
import { formatCompetitionTitle } from "./competitionTitle";

describe("formatCompetitionTitle", () => {
  it("combines a year-free competition name with its year", () => {
    expect(formatCompetitionTitle("Six Nations Championship", 2028)).toBe(
      "2028 Six Nations Championship"
    );
  });

  it("does not duplicate a year already present in an existing competition name", () => {
    expect(formatCompetitionTitle("Six Nations 2027 Championship", 2027)).toBe(
      "Six Nations 2027 Championship"
    );
  });
});
