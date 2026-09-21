import { beforeEach, describe, expect, it, vi } from "vitest";
import { SIX_NATIONS_TEAM_NAMES } from "@/lib/fixtureImport";

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: { findUnique: vi.fn(), update: vi.fn() },
    team: { findMany: vi.fn() },
    match: { createMany: vi.fn() },
    systemSetting: { upsert: vi.fn() },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

function fixtures() {
  const result = [];
  let number = 1;
  for (let home = 0; home < SIX_NATIONS_TEAM_NAMES.length; home++) {
    for (let away = home + 1; away < SIX_NATIONS_TEAM_NAMES.length; away++) {
      result.push({
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
  return result;
}

function request(bodyFixtures = fixtures()) {
  return new Request("http://localhost/api/admin/competitions/fixtures/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tournamentId: 8, fixtures: bodyFixtures }),
  });
}

describe("POST fixture import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      authorized: true,
      user: { id: 42, role: "ADMIN" },
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (callback: (tx: typeof prisma) => unknown) => callback(prisma)) as never
    );
    vi.mocked(prisma.team.findMany).mockResolvedValue(
      SIX_NATIONS_TEAM_NAMES.map((name, index) => ({ id: index + 1, name })) as never
    );
    vi.mocked(prisma.match.createMany).mockResolvedValue({ count: 15 });
    vi.mocked(prisma.tournament.update).mockResolvedValue({} as never);
    vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as never);
  });

  it("imports all fixtures and timing in one transaction", async () => {
    vi.mocked(prisma.tournament.findUnique)
      .mockResolvedValueOnce({ id: 8, name: "2028 Six Nations", year: 2028, status: "DRAFT" } as never)
      .mockResolvedValueOnce({ status: "DRAFT", _count: { matches: 0 } } as never);

    const response = await POST(request() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(15);
    expect(prisma.match.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.tournament.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: {
        firstKickoff: new Date("2028-02-01T14:00:00.000Z"),
        predictionLockAt: new Date("2028-02-01T13:59:00.000Z"),
      },
    });
    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "FIXTURE_IMPORT_AUDIT_8" } })
    );
  });

  it("rejects an invalid schedule before opening a transaction", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValueOnce({
      id: 8, name: "2028 Six Nations", year: 2028, status: "DRAFT",
    } as never);

    const response = await POST(request(fixtures().slice(0, 14)) as never);

    expect(response.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("prevents a second import after the transaction lock is acquired", async () => {
    vi.mocked(prisma.tournament.findUnique)
      .mockResolvedValueOnce({ id: 8, name: "2028 Six Nations", year: 2028, status: "DRAFT" } as never)
      .mockResolvedValueOnce({ status: "DRAFT", _count: { matches: 15 } } as never);

    const response = await POST(request() as never);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("already been imported");
    expect(prisma.match.createMany).not.toHaveBeenCalled();
  });
});
