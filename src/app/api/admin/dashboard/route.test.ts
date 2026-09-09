import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    prediction: {
      findMany: vi.fn(),
    },
    match: {
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
    },
    scoreAudit: {
      findMany: vi.fn(),
    },
    tournamentWinner: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const mockAdmin = {
  id: 1,
  email: "admin@example.com",
  role: "ADMIN",
};

const tournament = {
  id: 1,
  name: "Six Nations 2027 Championship",
  year: 2027,
  status: "OPEN",
};

function mockSuccessfulDashboard() {
  vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);
  vi.mocked(prisma.tournament.findUnique).mockResolvedValueOnce(
    tournament as any
  );

  vi.mocked(prisma.user.count)
    .mockResolvedValueOnce(35)
    .mockResolvedValueOnce(35);

  vi.mocked(prisma.prediction.findMany).mockResolvedValueOnce(
    [
      { userId: 1 },
      { userId: 2 },
      { userId: 3 },
      { userId: 4 },
    ] as any
  );

  vi.mocked(prisma.match.count)
    .mockResolvedValueOnce(15)
    .mockResolvedValueOnce(6);

  vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
  vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);
  vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([]);
  vi.mocked(prisma.tournamentWinner.findFirst).mockResolvedValueOnce(
    null
  );
}

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-02-20T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns real dashboard metrics for tournament id=1", async () => {
    mockSuccessfulDashboard();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    expect(body.metrics).toEqual({
      userCount: 35,
      verifiedUserCount: 35,
      predictionCount: 4,
      playersWithPredictions: 4,
      completedFixtures: 6,
      remainingFixtures: 9,
      totalFixtures: 15,
    });

    expect(body.totalUsers).toBe(35);
    expect(body.totalMatches).toBe(9);
    expect(body.completedMatches).toBe(6);
    expect(body.totalPredictions).toBe(4);

    expect(body.tournament).toEqual({
      id: 1,
      status: "OPEN",
      year: 2027,
      name: "Six Nations 2027 Championship",
    });
  });

  it("counts active users without excluding an entrant merely because they are an admin", async () => {
    mockSuccessfulDashboard();

    await GET();

    expect(prisma.user.count).toHaveBeenNthCalledWith(1, {
      where: {
        deletedAt: null,
      },
    });
  });

  it("counts players with predictions once, not one row per fixture", async () => {
    mockSuccessfulDashboard();

    await GET();

    expect(prisma.prediction.findMany).toHaveBeenCalledWith({
      where: {
        match: {
          tournamentId: 1,
        },
        user: {
          deletedAt: null,
        },
      },
      distinct: ["userId"],
      select: {
        userId: true,
      },
    });
  });

  it("counts a completed match only after 90 minutes and when both scores exist", async () => {
    mockSuccessfulDashboard();

    await GET();

    expect(prisma.match.count).toHaveBeenNthCalledWith(1, {
      where: {
        tournamentId: 1,
      },
    });

    expect(prisma.match.count).toHaveBeenNthCalledWith(2, {
      where: {
        tournamentId: 1,
        kickoffTime: {
          lte: new Date("2027-02-20T16:30:00.000Z"),
        },
        actualHomeScore: {
          not: null,
        },
        actualAwayScore: {
          not: null,
        },
      },
    });
  });

  it("returns 404 instead of misleading zeroes when tournament id=1 is missing", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: "Tournament id=1 was not found",
    });

    expect(prisma.user.count).not.toHaveBeenCalled();
    expect(prisma.match.count).not.toHaveBeenCalled();
  });

  it("returns 401 when authentication is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error("Authentication required")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: "Authentication required",
    });
  });

  it("returns 403 when admin access is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error("Admin access required")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      error: "Admin access required",
    });
  });
});
