import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    systemSetting: { findUnique: vi.fn() },
    tournament: { findUnique: vi.fn(), findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getCurrentTournament, getCurrentViewableTournament, requireCurrentTournament } from "./currentTournament";

describe("current competition selection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the explicitly selected competition when it exists", async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({ value: "7" } as never);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({ id: 7, year: 2027, status: "OPEN" } as never);

    await expect(getCurrentTournament()).resolves.toMatchObject({ id: 7 });
    expect(prisma.tournament.findFirst).not.toHaveBeenCalled();
  });

  it("falls back safely to an active competition without assuming id 1", async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.tournament.findFirst).mockResolvedValue({ id: 12, year: 2028 } as never);

    await expect(getCurrentTournament()).resolves.toMatchObject({ id: 12 });
    expect(prisma.tournament.findFirst).toHaveBeenCalledWith({
      where: { status: { in: ["OPEN", "LOCKED", "IN_PROGRESS"] } },
      orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
    });
  });


  it("keeps the selected completed competition viewable for read-only pages", async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({ value: "7" } as never);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 7,
      year: 2027,
      status: "COMPLETED",
    } as never);

    await expect(getCurrentViewableTournament()).resolves.toMatchObject({ id: 7, status: "COMPLETED" });
  });

  it("refuses operations when no current competition exists", async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.tournament.findFirst).mockResolvedValue(null);

    await expect(requireCurrentTournament()).rejects.toThrow(
      "No current competition is configured"
    );
  });
});
