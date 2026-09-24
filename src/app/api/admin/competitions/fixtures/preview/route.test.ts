import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireAdmin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/fixtureDiscovery", () => ({
  discoverCompetitionFixtures: vi.fn(),
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { discoverCompetitionFixtures } from "@/lib/fixtureDiscovery";
import { POST } from "./route";

function request(tournamentId: number) {
  return new Request("http://localhost/api/admin/competitions/fixtures/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tournamentId }),
  });
}

describe("POST fixture discovery preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("API_SPORTS_KEY", "test-key");
    vi.mocked(requireAdmin).mockResolvedValue({ authorized: true, user: { id: 1 } } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a read-only preview for an empty draft", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 8,
      name: "2028 Six Nations Championship",
      year: 2028,
      status: "DRAFT",
      _count: { matches: 0 },
    } as never);
    vi.mocked(discoverCompetitionFixtures).mockResolvedValue({
      provider: "API-Sports",
      providerLeague: { id: 12, name: "Six Nations" },
      fixtures: [],
      warnings: ["Expected 15 fixtures but found 0."],
      valid: false,
      expectedFixtureCount: 15,
      discoveredFixtureCount: 0,
    });

    const response = (await POST(request(8) as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persisted).toBe(false);
    expect(discoverCompetitionFixtures).toHaveBeenCalledWith("2028 Six Nations Championship", 2028, "test-key");
  });

  it("rejects a non-draft competition before provider discovery", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 1,
      status: "OPEN",
      _count: { matches: 15 },
    } as never);

    const response = (await POST(request(1) as never))!;

    expect(response.status).toBe(409);
    expect(discoverCompetitionFixtures).not.toHaveBeenCalled();
  });

  it("does not preview over fixtures already stored in a draft", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 8,
      status: "DRAFT",
      _count: { matches: 1 },
    } as never);

    const response = (await POST(request(8) as never))!;
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("already contains fixtures");
    expect(discoverCompetitionFixtures).not.toHaveBeenCalled();
  });
});
