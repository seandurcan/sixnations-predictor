import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getCurrentTournament,
  getCurrentViewableTournament,
  requireCurrentTournament,
} from "./currentTournament";

describe("current competition selection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("defines current as the soonest active competition", async () => {
    vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce({
      id: 12,
      year: 2027,
      status: "OPEN",
      firstKickoff: new Date("2027-02-01T14:00:00Z"),
    } as never);

    await expect(getCurrentTournament()).resolves.toMatchObject({ id: 12 });
    expect(prisma.tournament.findFirst).toHaveBeenCalledWith({
      where: { status: { in: ["OPEN", "LOCKED", "IN_PROGRESS"] } },
      orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
    });
  });

  it("uses the soonest active competition for viewable pages", async () => {
    vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce({
      id: 5,
      status: "IN_PROGRESS",
    } as never);

    await expect(getCurrentViewableTournament()).resolves.toMatchObject({
      id: 5,
      status: "IN_PROGRESS",
    });
    expect(prisma.tournament.findFirst).toHaveBeenCalledTimes(1);
  });

  it("falls back to the most recent completed or archived competition when none is active", async () => {
    vi.mocked(prisma.tournament.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 7,
        status: "COMPLETED",
        firstKickoff: new Date("2026-02-01T14:00:00Z"),
      } as never);

    await expect(getCurrentViewableTournament()).resolves.toMatchObject({
      id: 7,
      status: "COMPLETED",
    });
    expect(prisma.tournament.findFirst).toHaveBeenLastCalledWith({
      where: { status: { in: ["COMPLETED", "ARCHIVED"] } },
      orderBy: [{ firstKickoff: "desc" }, { id: "desc" }],
    });
  });

  it("refuses operations when no current competition exists", async () => {
    vi.mocked(prisma.tournament.findFirst).mockResolvedValue(null);

    await expect(requireCurrentTournament()).rejects.toThrow(
      "No current competition is configured"
    );
  });
});
