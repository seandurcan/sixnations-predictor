import { describe, expect, it } from "vitest";
import { prepareFixtureImport, SIX_NATIONS_TEAM_NAMES } from "./fixtureImport";

function validFixtures() {
  const fixtures = [];
  let number = 1;
  for (let home = 0; home < SIX_NATIONS_TEAM_NAMES.length; home++) {
    for (let away = home + 1; away < SIX_NATIONS_TEAM_NAMES.length; away++) {
      fixtures.push({
        providerGameId: number,
        kickoffTime: new Date(Date.UTC(2028, 1, number, 14)).toISOString(),
        homeTeam: SIX_NATIONS_TEAM_NAMES[home],
        awayTeam: SIX_NATIONS_TEAM_NAMES[away],
        venue: `Stadium ${number}`,
        city: "City",
        country: "Country",
      });
      number++;
    }
  }
  return fixtures.reverse();
}

describe("prepareFixtureImport", () => {
  it("orders a full schedule and assigns five rounds", () => {
    const result = prepareFixtureImport(validFixtures(), 2028);
    expect(result.errors).toEqual([]);
    expect(result.fixtures).toHaveLength(15);
    expect(result.fixtures.map((fixture) => fixture.matchNumber)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1)
    );
    expect(result.fixtures.map((fixture) => fixture.round)).toEqual([
      1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5,
    ]);
  });

  it("rejects duplicate pairings", () => {
    const fixtures = validFixtures();
    fixtures[1] = { ...fixtures[0], providerGameId: 999 };
    const result = prepareFixtureImport(fixtures, 2028);
    expect(result.errors).toContain(
      "Each pair of teams must meet exactly once; duplicate pairings were found."
    );
  });

  it("rejects a kickoff outside the competition year", () => {
    const fixtures = validFixtures();
    fixtures[0].kickoffTime = "2029-02-01T14:00:00.000Z";
    expect(prepareFixtureImport(fixtures, 2028).errors[0]).toContain("must be in 2028");
  });
});
