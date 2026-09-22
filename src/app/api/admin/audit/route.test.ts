import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    scoreAudit: { count: vi.fn(), findMany: vi.fn() },
    adminUserActionAudit: { count: vi.fn(), findMany: vi.fn() },
    user: { findMany: vi.fn() },
    team: { findMany: vi.fn() },
    match: { findMany: vi.fn() },
    systemSetting: { findMany: vi.fn() },
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

function request(query = "") {
  return new Request(`http://localhost/api/admin/audit${query}`) as never;
}

const scoreAudit = {
  id: 3,
  matchId: 8,
  previousHome: 10,
  previousAway: 12,
  newHome: 20,
  newAway: 19,
  adminUserId: 1,
  createdAt: new Date("2026-09-21T10:00:00.000Z"),
};

const accountAudit = {
  id: 4,
  adminUserId: 1,
  targetUserId: 9,
  action: "DELETE_ACCOUNT",
  status: "SUCCEEDED",
  targetEmailHash: "secret-hash",
  detail: "Removed person@example.com token ABCDEF0123456789ABCDEF0123456789",
  createdAt: new Date("2026-09-22T10:00:00.000Z"),
};

function mockSuccessfulLoad() {
  vi.mocked(prisma.scoreAudit.count).mockResolvedValue(1);
  vi.mocked(prisma.adminUserActionAudit.count).mockResolvedValue(1);
  vi.mocked(prisma.scoreAudit.findMany).mockResolvedValue([scoreAudit] as never);
  vi.mocked(prisma.adminUserActionAudit.findMany).mockResolvedValue([accountAudit] as never);
  vi.mocked(prisma.user.findMany).mockResolvedValue([
    { id: 1, firstName: "Admin", lastName: "User", deletedAt: null },
    { id: 9, firstName: "Former", lastName: "Participant", deletedAt: new Date() },
  ] as never);
  vi.mocked(prisma.match.findMany).mockResolvedValue([{
    id: 8,
    homeTeam: { shortCode: "IRE" },
    awayTeam: { shortCode: "FRA" },
  }] as never);
  vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);
}

describe("GET /api/admin/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ authorized: true, user: { id: 1, role: "ADMIN" } } as never);
    mockSuccessfulLoad();
  });

  it("requires administrator access before querying audit data", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as never);

    const response = (await GET(request()))!;

    expect(response.status).toBe(401);
    expect(prisma.scoreAudit.count).not.toHaveBeenCalled();
    expect(prisma.adminUserActionAudit.count).not.toHaveBeenCalled();
  });

  it("returns one chronological history for result and account actions", async () => {
    const response = (await GET(request()))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
    expect(body.totals).toEqual({ resultChanges: 1, accountActions: 1 });
    expect(body.records.map((record: { id: string }) => record.id)).toEqual(["account-4", "result-3"]);
    expect(body.records[0]).toMatchObject({
      category: "ACCOUNT",
      action: "DELETE_ACCOUNT",
      target: { id: 9, label: "Former Participant (account 9)" },
      admin: { id: 1, name: "Admin User" },
    });
    expect(body.records[0].detail).toBe("Removed [email redacted] token [token redacted]");
    expect(body.records[0].targetEmailHash).toBeUndefined();
    expect(body.records[1]).toMatchObject({
      category: "RESULT",
      target: { label: "IRE v FRA", previous: "10 - 12", current: "20 - 19" },
    });
  });

  it("applies account action, status and date filters on the server", async () => {
    vi.mocked(prisma.adminUserActionAudit.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.adminUserActionAudit.findMany).mockResolvedValueOnce([]);

    await GET(request("?category=ACCOUNT&action=DELETE_ACCOUNT&status=FAILED&from=2026-09-01&to=2026-09-22"));

    expect(prisma.scoreAudit.count).not.toHaveBeenCalled();
    expect(prisma.adminUserActionAudit.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        action: "DELETE_ACCOUNT",
        status: "FAILED",
        createdAt: {
          gte: new Date("2026-09-01T00:00:00.000Z"),
          lt: new Date("2026-09-23T00:00:00.000Z"),
        },
      }),
    });
  });

  it("searches administrators, users, account numbers and teams", async () => {
    vi.mocked(prisma.user.findMany)
      .mockResolvedValueOnce([{ id: 9 }] as never)
      .mockResolvedValueOnce([{ id: 9, firstName: "Sean", lastName: "Durcan", deletedAt: null }] as never);
    vi.mocked(prisma.team.findMany).mockResolvedValueOnce([{ id: 2 }] as never);
    vi.mocked(prisma.match.findMany)
      .mockResolvedValueOnce([{ id: 8 }] as never)
      .mockResolvedValueOnce([{ id: 8, homeTeam: { shortCode: "IRE" }, awayTeam: { shortCode: "FRA" } }] as never);

    await GET(request("?q=9"));

    expect(prisma.scoreAudit.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [{ adminUserId: { in: [9] } }, { matchId: { in: [8] } }],
      }),
    });
    expect(prisma.adminUserActionAudit.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { adminUserId: { in: [9] } },
          { targetUserId: { in: [9] } },
          { targetUserId: 9 },
        ],
      }),
    });
  });

  it("uses bounded merged pagination", async () => {
    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(25);
    vi.mocked(prisma.adminUserActionAudit.count).mockResolvedValueOnce(25);
    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.adminUserActionAudit.findMany).mockResolvedValueOnce([]);

    const response = (await GET(request("?page=2")))!;
    const body = await response.json();

    expect(body.pagination).toEqual({ page: 2, pageSize: 20, total: 50, totalPages: 3 });
    expect(prisma.scoreAudit.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 40 }));
    expect(prisma.adminUserActionAudit.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 40 }));
  });

  it("returns a controlled error when loading fails", async () => {
    vi.mocked(prisma.scoreAudit.count).mockRejectedValueOnce(new Error("Database unavailable"));

    const response = (await GET(request()))!;
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: "Unable to load audit history." });
  });
});
