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
      count: vi.fn(),
    },
    match: {
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    tournament: {
      findFirst: vi.fn(),
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

const mockAdminUser = {
  id: 1,
  email: "admin@example.com",
  role: "ADMIN",
};

const mockTournament = {
  id: 1,
  name: "Six Nations Predictor",
  year: 2027,
  status: "OPEN",
};

const mockCurrentLeader = {
  id: 11,
  firstName: "Aoife",
  lastName: "Murphy",
  totalPoints: 48,
  exactScores: 4,
  cumulativeError: 12,
};

const mockLeaderboard = [
  {
    id: 11,
    firstName: "Aoife",
    lastName: "Murphy",
    totalPoints: 48,
    exactScores: 4,
  },
  {
    id: 12,
    firstName: "Sean",
    lastName: "Durcan",
    totalPoints: 43,
    exactScores: 3,
  },
];

const mockAudits = [
  {
    id: 301,
    matchId: 101,
    previousHome: null,
    previousAway: null,
    newHome: 28,
    newAway: 20,
    adminUserId: 1,
    createdAt: new Date("2027-01-29T18:30:00.000Z"),
  },
  {
    id: 302,
    matchId: 102,
    previousHome: 17,
    previousAway: 14,
    newHome: 24,
    newAway: 17,
    adminUserId: 2,
    createdAt: new Date("2027-01-30T20:15:00.000Z"),
  },
];

const mockAuditMatchOne = {
  id: 101,
  homeTeam: {
    id: 1,
    name: "Ireland",
    shortCode: "IRE",
  },
  awayTeam: {
    id: 2,
    name: "France",
    shortCode: "FRA",
  },
};

const mockAuditMatchTwo = {
  id: 102,
  homeTeam: {
    id: 3,
    name: "Scotland",
    shortCode: "SCO",
  },
  awayTeam: {
    id: 4,
    name: "England",
    shortCode: "ENG",
  },
};

const mockAuditAdminOne = {
  id: 1,
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
};

const mockAuditAdminTwo = {
  id: 2,
  firstName: "Result",
  lastName: "Manager",
  email: "result@example.com",
};

const mockWinnerRecord = {
  id: 501,
  tournamentId: 1,
  userId: 11,
  finalPoints: 88,
  createdAt: new Date("2027-03-20T20:00:00.000Z"),
};

const mockWinnerUser = {
  id: 11,
  firstName: "Aoife",
  lastName: "Murphy",
  email: "aoife@example.com",
};

function mockSuccessfulDashboardData() {
  vi.mocked(requireAdmin).mockResolvedValueOnce(
    mockAdminUser as any
  );

  vi.mocked(prisma.user.count)
    .mockResolvedValueOnce(42)
    .mockResolvedValueOnce(37);

  vi.mocked(prisma.prediction.count).mockResolvedValueOnce(
    210
  );

  vi.mocked(prisma.match.count)
    .mockResolvedValueOnce(6)
    .mockResolvedValueOnce(15);

  vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce(
    mockTournament as any
  );

  vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(
    mockCurrentLeader as any
  );

  vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
    mockLeaderboard as any
  );

  vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce(
    mockAudits as any
  );

  vi.mocked(prisma.match.findUnique)
    .mockResolvedValueOnce(mockAuditMatchOne as any)
    .mockResolvedValueOnce(mockAuditMatchTwo as any);

  vi.mocked(prisma.user.findUnique)
    .mockResolvedValueOnce(mockAuditAdminOne as any)
    .mockResolvedValueOnce(mockAuditAdminTwo as any)
    .mockResolvedValueOnce(mockWinnerUser as any);

  vi.mocked(
    prisma.tournamentWinner.findFirst
  ).mockResolvedValueOnce(mockWinnerRecord as any);
}

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns dashboard metrics, tournament, leader, leaderboard, winner, and recent audits", async () => {
    mockSuccessfulDashboardData();

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.success).toBe(true);

    expect(body.metrics).toEqual({
      userCount: 42,
      verifiedUserCount: 37,
      predictionCount: 210,
      completedFixtures: 6,
      remainingFixtures: 9,
      totalFixtures: 15,
    });

    expect(body.tournament).toEqual({
      status: "OPEN",
      year: 2027,
      name: "Six Nations Predictor",
    });

    expect(body.currentLeader).toEqual({
      id: 11,
      firstName: "Aoife",
      lastName: "Murphy",
      totalPoints: 48,
      exactScores: 4,
    });

    expect(body.leaderboard).toEqual(mockLeaderboard);

    expect(body.winner).toEqual({
      ...mockWinnerRecord,
      createdAt: mockWinnerRecord.createdAt.toISOString(),
      user: mockWinnerUser,
    });

    expect(body.recentAudits).toHaveLength(2);

    expect(body.recentAudits[0]).toEqual({
      ...mockAudits[0],
      createdAt: mockAudits[0].createdAt.toISOString(),
      match: mockAuditMatchOne,
      adminUser: mockAuditAdminOne,
    });

    expect(body.recentAudits[1]).toEqual({
      ...mockAudits[1],
      createdAt: mockAudits[1].createdAt.toISOString(),
      match: mockAuditMatchTwo,
      adminUser: mockAuditAdminTwo,
    });
  });

  it("requires admin access before loading dashboard data", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(requireAdmin).toHaveBeenCalledTimes(1);
  });

  it("counts users, verified users, predictions, completed fixtures, and total fixtures", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(prisma.user.count).toHaveBeenNthCalledWith(
      1
    );

    expect(prisma.user.count).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          emailVerified: true,
        },
      }
    );

    expect(prisma.prediction.count).toHaveBeenCalledTimes(
      1
    );

    expect(prisma.match.count).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          completed: true,
        },
      }
    );

    expect(prisma.match.count).toHaveBeenNthCalledWith(
      2
    );
  });

  it("loads the latest tournament by descending id", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(prisma.tournament.findFirst).toHaveBeenCalledWith(
      {
        orderBy: {
          id: "desc",
        },
      }
    );
  });

  it("loads current leader ordered by points then cumulative error", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      orderBy: [
        {
          totalPoints: "desc",
        },
        {
          cumulativeError: "asc",
        },
      ],
    });
  });

  it("loads top 10 leaderboard with selected fields", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      take: 10,
      orderBy: [
        {
          totalPoints: "desc",
        },
        {
          cumulativeError: "asc",
        },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalPoints: true,
        exactScores: true,
      },
    });
  });

  it("loads recent audits ordered by created date descending", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(prisma.scoreAudit.findMany).toHaveBeenCalledWith({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("enriches each recent audit with match and admin user", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(prisma.match.findUnique).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          id: 101,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      }
    );

    expect(prisma.match.findUnique).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          id: 102,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      }
    );

    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          id: 1,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }
    );

    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          id: 2,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }
    );
  });

  it("loads winner record and enriches winner with user details", async () => {
    mockSuccessfulDashboardData();

    await GET();

    expect(
      prisma.tournamentWinner.findFirst
    ).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(
      3,
      {
        where: {
          id: 11,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }
    );
  });

  it("returns fallback tournament values when tournament is missing", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      mockAdminUser as any
    );

    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    vi.mocked(prisma.prediction.count).mockResolvedValueOnce(
      0
    );

    vi.mocked(prisma.match.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce(
      null
    );

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(
      null
    );

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      []
    );

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce(
      []
    );

    vi.mocked(
      prisma.tournamentWinner.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.tournament).toEqual({
      status: "UNKNOWN",
      year: null,
      name: null,
    });

    expect(body.currentLeader).toBeNull();
    expect(body.leaderboard).toEqual([]);
    expect(body.winner).toBeNull();
    expect(body.recentAudits).toEqual([]);
  });

  it("returns null winner when no tournament winner exists", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      mockAdminUser as any
    );

    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce(37);

    vi.mocked(prisma.prediction.count).mockResolvedValueOnce(
      210
    );

    vi.mocked(prisma.match.count)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(15);

    vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce(
      mockTournament as any
    );

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(
      mockCurrentLeader as any
    );

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockLeaderboard as any
    );

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce(
      []
    );

    vi.mocked(
      prisma.tournamentWinner.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.winner).toBeNull();
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

  it("returns 500 when dashboard query fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      mockAdminUser as any
    );

    vi.mocked(prisma.user.count).mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load dashboard",
    });
  });

  it("returns 500 when audit enrichment fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      mockAdminUser as any
    );

    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce(37);

    vi.mocked(prisma.prediction.count).mockResolvedValueOnce(
      210
    );

    vi.mocked(prisma.match.count)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(15);

    vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce(
      mockTournament as any
    );

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(
      mockCurrentLeader as any
    );

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockLeaderboard as any
    );

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce(
      mockAudits as any
    );

    vi.mocked(prisma.match.findUnique).mockRejectedValueOnce(
      new Error("Audit match lookup failed")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load dashboard",
    });
  });

  it("returns 500 when winner enrichment fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(
      mockAdminUser as any
    );

    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce(37);

    vi.mocked(prisma.prediction.count).mockResolvedValueOnce(
      210
    );

    vi.mocked(prisma.match.count)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(15);

    vi.mocked(prisma.tournament.findFirst).mockResolvedValueOnce(
      mockTournament as any
    );

    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(
      mockCurrentLeader as any
    );

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockLeaderboard as any
    );

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce(
      []
    );

    vi.mocked(
      prisma.tournamentWinner.findFirst
    ).mockResolvedValueOnce(mockWinnerRecord as any);

    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
      new Error("Winner user lookup failed")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load dashboard",
    });
  });
});