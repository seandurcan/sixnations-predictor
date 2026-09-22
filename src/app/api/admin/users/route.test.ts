import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/currentTournament", () => ({ getCurrentTournament: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { count: vi.fn(), findMany: vi.fn() } },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCurrentTournament } from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

function request(query = "") {
  return new Request(`http://localhost/api/admin/users${query}`);
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      authorized: true,
      user: { id: 42, role: "ADMIN" },
    } as never);
    vi.mocked(getCurrentTournament).mockResolvedValue({
      id: 7,
      year: 2027,
      name: "Six Nations Championship",
    } as never);
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(144)
      .mockResolvedValueOnce(144)
      .mockResolvedValueOnce(38)
      .mockResolvedValueOnce(2);
    vi.mocked(prisma.user.findMany).mockResolvedValue([{
      id: 9,
      firstName: "Sean",
      lastName: "Durcan",
      email: "sean@example.com",
      mobile: "0870000000",
      role: "ADMIN",
      emailVerified: true,
      announcementOptOutAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      competitionEntries: [{
        status: "ENTERED",
        paymentStatus: "PAID",
        predictionsSubmitted: true,
      }],
    }] as never);
  });

  it("requires administrator access", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as never);

    const response = (await GET(request() as never))!;

    expect(response.status).toBe(401);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("returns only safe account fields and current entry status", async () => {
    const response = (await GET(request() as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users[0]).toMatchObject({
      id: 9,
      firstName: "Sean",
      lastName: "Durcan",
      currentEntry: {
        status: "ENTERED",
        paymentStatus: "PAID",
        predictionsSubmitted: true,
      },
    });
    expect(body.users[0].passwordHash).toBeUndefined();
    expect(body.totals).toEqual({
      users: 144,
      verified: 144,
      currentEntrants: 38,
      optedOut: 2,
    });
  });

  it("applies search and account filters on the server", async () => {
    await GET(request("?q=Durcan&verification=VERIFIED&role=ADMIN&entry=ENTERED&announcements=SUBSCRIBED") as never);

    expect(prisma.user.count).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        deletedAt: null,
        emailVerified: true,
        role: "ADMIN",
        announcementOptOutAt: null,
        competitionEntries: {
          some: { tournamentId: 7, status: "ENTERED" },
        },
        OR: expect.arrayContaining([
          { lastName: { contains: "Durcan", mode: "insensitive" } },
          { email: { contains: "Durcan", mode: "insensitive" } },
        ]),
      }),
    });
  });

  it("treats invited or missing current entries as not entered", async () => {
    await GET(request("?entry=NOT_ENTERED") as never);

    expect(prisma.user.count).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        competitionEntries: {
          none: { tournamentId: 7, status: "ENTERED" },
        },
      }),
    });
  });

  it("uses bounded pagination and stable surname ordering", async () => {
    vi.mocked(prisma.user.count).mockReset();
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(144)
      .mockResolvedValueOnce(144)
      .mockResolvedValueOnce(38)
      .mockResolvedValueOnce(2);
    await GET(request("?page=3") as never);

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 80,
      take: 40,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
    }));
  });
});
