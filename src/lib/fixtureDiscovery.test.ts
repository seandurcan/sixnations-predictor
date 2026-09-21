import { describe, expect, it } from "vitest";
import { validateFixturePreview, type FixturePreview } from "./fixtureDiscovery";

const teams = ["England", "France", "Ireland", "Italy", "Scotland", "Wales"] as const;

function completeRoundRobin(): FixturePreview[] {
  const fixtures: FixturePreview[] = [];
  let id = 1;
  for (let home = 0; home < teams.length; home++) {
    for (let away = home + 1; away < teams.length; away++) {
      fixtures.push({
        providerGameId: id,
        round: null,
        kickoffTime: new Date(Date.UTC(2028, 1, id, 14)).toISOString(),
        homeTeam: teams[home],
        awayTeam: teams[away],
        providerHomeTeam: teams[home],
        providerAwayTeam: teams[away],
        venue: `Stadium ${id}`,
        city: null,
        country: null,
      });
      id++;
    }
  }
  return fixtures;
}

describe("fixture preview validation", () => {
  it("accepts one complete 15-match round robin", () => {
    expect(validateFixturePreview(completeRoundRobin())).toEqual({
      warnings: [],
      valid: true,
    });
  });

  it("flags an incomplete and duplicated schedule", () => {
    const fixtures = completeRoundRobin().slice(0, 14);
    fixtures[13] = { ...fixtures[0], providerGameId: 99 };
    const result = validateFixturePreview(fixtures);
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain("Expected 15 fixtures but found 14.");
    expect(result.warnings).toContain("One or more team pairings are duplicated.");
  });
});
