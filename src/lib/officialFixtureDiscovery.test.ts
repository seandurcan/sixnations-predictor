import { describe, expect, it } from "vitest";
import {
  buildRwc2027PoolFixtures,
  supportsOfficialFixtureDiscovery,
} from "@/lib/officialFixtureDiscovery";

describe("Rugby World Cup official fixture fallback", () => {
  it("recognises Rugby World Cup competitions", () => {
    expect(supportsOfficialFixtureDiscovery("Rugby World Cup")).toBe(true);
    expect(supportsOfficialFixtureDiscovery("Men's Rugby World Cup 2027")).toBe(true);
  });

  it("loads all 36 published pool fixtures and all 24 teams", () => {
    const fixtures = buildRwc2027PoolFixtures(2027);
    const teams = new Set(
      fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
    );

    expect(fixtures).toHaveLength(36);
    expect(teams.size).toBe(24);
  });

  it("keeps the published opening match and Ireland pool fixtures", () => {
    const fixtures = buildRwc2027PoolFixtures(2027);

    expect(fixtures[0]).toMatchObject({
      round: 1,
      homeTeam: "Australia",
      awayTeam: "Hong Kong China",
      venue: "Perth Stadium",
      city: "Perth",
    });

    expect(
      fixtures.filter(
        (fixture) =>
          fixture.homeTeam === "Ireland" || fixture.awayTeam === "Ireland"
      )
    ).toHaveLength(3);
  });

  it("does not fabricate schedules for other World Cup years", () => {
    expect(buildRwc2027PoolFixtures(2031)).toEqual([]);
  });
});
