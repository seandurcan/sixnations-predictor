import { beforeEach, describe, expect, it, vi } from "vitest";
import { SIX_NATIONS_TEAM_NAMES } from "@/lib/fixtureImport";

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/currentTournament", () => ({
  CURRENT_TOURNAMENT_SETTING: "CURRENT_TOURNAMENT_ID",
  getCurrentTournament: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    systemSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

function competition(status: "DRAFT" | "READY" = "DRAFT") {
  const matches = [];
  let matchNumber = 1;
  for (let home = 0; home < SIX_NATIONS_TEAM_NAMES.length; home++) {
    for (let away = home + 1; away < SIX_NATIONS_TEAM_NAMES.length; away++) {
      matches.push({
        id: matchNumber,
        tournamentId: 8,
        round: Math.floor((matchNumber - 1) / 3) + 1,
        matchNumber,
        kickoffTime: new Date(Date.UTC(2028, 1, matchNumber, 14)),
        venue: `Stadium ${matchNumber}`,
        city: "City",
        country: "Country",
        homeTeam: { name: SIX_NATIONS_TEAM_NAMES[home] },
        awayTeam: { name: SIX_NATIONS_TEAM_NAMES[away] },
      });
      matchNumber++;
    }
  }
  return {
    id: 8,
    year: 2028,
    name: "Six Nations Championship",
    status,
    firstKickoff: new Date("2028-02-01T14:00:00.000Z"),
    predictionLockAt: new Date("2028-02-01T13:59:00.000Z"),
    matches,
  };
}

function request(action: "mark_ready" | "activate") {
  return new Request("http://localhost/api/admin/competitions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tournamentId: 8, action }),
  });
}

describe("PATCH competition lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      authorized: true,
      user: { id: 42, role: "ADMIN" },
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (callback: (tx: typeof prisma) => unknown) => callback(prisma)) as never
    );
    vi.mocked(prisma.tournament.update).mockResolvedValue({} as never);
    vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as never);
  });

  it("validates a complete draft and marks it ready without changing the current competition", async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValueOnce(
      competition("DRAFT") as never
    );

    const response = (await PATCH(request("mark_ready") as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.competitionStatus).toBe("READY");
    expect(prisma.tournament.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { status: "READY" },
    });
    expect(prisma.systemSetting.upsert).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "CURRENT_TOURNAMENT_ID" } })
    );
  });

  it("does not mark an incomplete draft ready", async () => {
    const incomplete = competition("DRAFT");
    incomplete.matches.pop();
    vi.mocked(prisma.tournament.findUnique).mockResolvedValueOnce(incomplete as never);

    const response = (await PATCH(request("mark_ready") as never))!;

    expect(response.status).toBe(409);
    expect(prisma.tournament.update).not.toHaveBeenCalled();
  });

  it("blocks activation while the current competition is still active", async () => {
    vi.mocked(prisma.tournament.findUnique)
      .mockResolvedValueOnce(competition("READY") as never)
      .mockResolvedValueOnce({ id: 1, year: 2027, status: "OPEN" } as never);
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: "CURRENT_TOURNAMENT_ID",
      value: "1",
    } as never);

    const response = (await PATCH(request("activate") as never))!;
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("must be completed");
    expect(prisma.tournament.update).not.toHaveBeenCalled();
  });

  it("archives a completed current competition and activates the ready competition", async () => {
    vi.mocked(prisma.tournament.findUnique)
      .mockResolvedValueOnce(competition("READY") as never)
      .mockResolvedValueOnce({ id: 1, year: 2027, status: "COMPLETED" } as never);
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: "CURRENT_TOURNAMENT_ID",
      value: "1",
    } as never);

    const response = (await PATCH(request("activate") as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.currentTournamentId).toBe(8);
    expect(prisma.tournament.update).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { status: "ARCHIVED" },
    });
    expect(prisma.tournament.update).toHaveBeenNthCalledWith(2, {
      where: { id: 8 },
      data: { status: "OPEN" },
    });
    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith({
      where: { key: "CURRENT_TOURNAMENT_ID" },
      update: { value: "8" },
      create: { key: "CURRENT_TOURNAMENT_ID", value: "8" },
    });
  });
});
