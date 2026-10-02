import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverFixturesAutomatically } from "@/lib/automatedFixtureDiscovery";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("automatic fixture discovery", () => {
  it("tries API-Sports first and returns it when fixtures are available", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("/leagues?search=")) {
        return new Response(JSON.stringify({
          results: 1,
          response: [{ id: 69, name: "World Cup", seasons: [2027] }],
        }), { status: 200 });
      }
      if (url.includes("/games?league=69&season=2027")) {
        return new Response(JSON.stringify({
          results: 1,
          response: [{
            id: 1,
            date: "2027-10-01T10:45:00Z",
            round: 1,
            teams: { home: { name: "Australia" }, away: { name: "Hong Kong China" } },
            venue: { name: "Perth Stadium", city: "Perth" },
            country: "Australia",
          }],
        }), { status: 200 });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await discoverFixturesAutomatically({
      competitionName: "Rugby World Cup",
      year: 2027,
      apiSportsKey: "test",
      openAiKey: null,
    });

    expect(result.selectedSource).toBe("API_SPORTS");
    expect(result.fixtures).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls through to the official World Cup adapter when API-Sports rejects the season", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("/leagues?search=")) {
        return new Response(JSON.stringify({
          results: 1,
          response: [{ id: 69, name: "World Cup", seasons: [2027] }],
        }), { status: 200 });
      }
      if (url.includes("/games?league=69&season=2027")) {
        return new Response(JSON.stringify({
          errors: { plan: "Free plans do not have access to this season" },
          response: [],
        }), { status: 200 });
      }
      if (url.includes("rugbyworldcup.com/2027/en/matches")) {
        return new Response("<html></html>", { status: 200 });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await discoverFixturesAutomatically({
      competitionName: "Rugby World Cup",
      year: 2027,
      apiSportsKey: "test",
      openAiKey: null,
    });

    expect(result.selectedSource).toBe("OFFICIAL_OR_PUBLISHED");
    expect(result.fixtures).toHaveLength(36);
    expect(result.attempts[0].status).toBe("FAILED");
    expect(result.attempts[1].status).toBe("SUCCESS");
  });
});
