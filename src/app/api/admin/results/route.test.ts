import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    match: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    scoreAudit: {
      create: vi.fn(),
    },
    prediction: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    leaderboardSnapshot: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    tournament: {
      update: vi.fn(),
    },
    tournamentWinner: {
      upsert: vi.fn(),
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

const existingMatch = {
  id: 101,
  actualHomeScore: null,
  actualAwayScore: null,
  completed: false,
};

const updatedMatch = {
  id: 101,
  actualHomeScore: 28,
  actualAwayScore: 20,
  completed: true,
};

const mockPredictions = [
  {
    id: 301,
    userId: 10,
    matchId: 101,
    predictedHomeScore: 28,
    predictedAwayScore: 20,
  },
  {
    id: 302,
    userId: 11,
    matchId: 101,
    predictedHomeScore: 21,
    predictedAwayScore: 18,
  },
  {
    id: 303,
    userId: 12,
    matchId: 101,
    predictedHomeScore: 20,
    predictedAwayScore: 28,
  },
];

const mockUsersAfterPredictionUpdate = [
  {
    id: 10,
    registrationOrder: 1,
    predictions: [
      {
        pointsAwarded: 13,
        errorValue: 0,
        exactScore: true,
        differenceScore: 0,
      },
    ],
  },
  {
    id: 11,
    registrationOrder: 2,
    predictions: [
      {
        pointsAwarded: 3,
        errorValue: 9,
        exactScore: false,
        differenceScore: -9,
      },
    ],
  },
];

const mockRefreshedUsers = [
  {
    id: 10,
    totalPoints: 13,
    exactScores: 1,
    cumulativeError: 0,
    registrationOrder: 1,
    predictions: [
      {
        differenceScore: 0,
      },
    ],
  },
  {
    id: 11,
    totalPoints: 3,
    exactScores: 0,
    cumulativeError: 9,
    registrationOrder: 2,
    predictions: [
      {
        differenceScore: -9,
      },
    ],
  },
];

function createResultRequest(body: any) {
  return new Request("http://localhost/api/admin/results", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function mockSuccessfulResultSave({
  completedMatches = 1,
  totalMatches = 15,
  latestSnapshot = null,
  previousSnapshots = [],
}: {
  completedMatches?: number;
  totalMatches?: number;
  latestSnapshot?: any;
  previousSnapshots?: any[];
} = {}) {
  vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

  vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
    existingMatch as any
  );

  vi.mocked(prisma.scoreAudit.create).mockResolvedValueOnce({
    id: 900,
  } as any);

  vi.mocked(prisma.match.update).mockResolvedValueOnce(
    updatedMatch as any
  );

  vi.mocked(prisma.prediction.findMany).mockResolvedValueOnce(
    mockPredictions as any
  );

  vi.mocked(prisma.prediction.update).mockResolvedValue(
    {} as any
  );

  vi.mocked(prisma.user.findMany)
    .mockResolvedValueOnce(mockUsersAfterPredictionUpdate as any)
    .mockResolvedValueOnce(mockRefreshedUsers as any);

  vi.mocked(prisma.user.update).mockResolvedValue({} as any);

  vi.mocked(
    prisma.leaderboardSnapshot.findFirst
  ).mockResolvedValueOnce(latestSnapshot as any);

  if (latestSnapshot) {
    vi.mocked(
      prisma.leaderboardSnapshot.findMany
    ).mockResolvedValueOnce(previousSnapshots as any);
  }

  vi.mocked(
    prisma.leaderboardSnapshot.create
  ).mockResolvedValue({} as any);

  vi.mocked(prisma.match.count)
    .mockResolvedValueOnce(completedMatches)
    .mockResolvedValueOnce(totalMatches);

  vi.mocked(prisma.tournament.update).mockResolvedValue(
    {} as any
  );

  vi.mocked(
    prisma.tournamentWinner.upsert
  ).mockResolvedValue({} as any);
}

describe("POST /api/admin/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves result, audits change, updates match, scores predictions, updates users, creates snapshot", async () => {
    mockSuccessfulResultSave();

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.snapshotNumber).toBe(1);
    expect(body.match).toEqual(updatedMatch);

    expect(requireAdmin).toHaveBeenCalledTimes(1);

    expect(prisma.match.findUnique).toHaveBeenCalledWith({
      where: {
        id: 101,
      },
    });

    expect(prisma.scoreAudit.create).toHaveBeenCalledWith({
      data: {
        matchId: 101,
        previousHome: null,
        previousAway: null,
        newHome: 28,
        newAway: 20,
        adminUserId: 1,
      },
    });

    expect(prisma.match.update).toHaveBeenCalledWith({
      where: {
        id: 101,
      },
      data: {
        actualHomeScore: 28,
        actualAwayScore: 20,
        completed: true,
      },
    });

    expect(prisma.prediction.findMany).toHaveBeenCalledWith({
      where: {
        matchId: 101,
      },
    });

    expect(prisma.prediction.update).toHaveBeenCalledTimes(3);

    expect(prisma.user.update).toHaveBeenCalledTimes(2);

    expect(
      prisma.leaderboardSnapshot.create
    ).toHaveBeenCalledTimes(2);
  });

  it("awards exact score prediction with 13 points", async () => {
    mockSuccessfulResultSave();

    await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    expect(prisma.prediction.update).toHaveBeenCalledWith({
      where: {
        id: 301,
      },
      data: {
        pointsAwarded: 13,
        errorValue: 0,
        exactScore: true,
        differenceScore: -0,
      },
    });
  });

  it("awards correct outcome but not exact score with 3 points", async () => {
    mockSuccessfulResultSave();

    await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    expect(prisma.prediction.update).toHaveBeenCalledWith({
      where: {
        id: 302,
      },
      data: {
        pointsAwarded: 3,
        errorValue: 9,
        exactScore: false,
        differenceScore: -5,
      },
    });
  });

  it("awards zero points for incorrect outcome", async () => {
    mockSuccessfulResultSave();

    await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    expect(prisma.prediction.update).toHaveBeenCalledWith({
      where: {
        id: 303,
      },
      data: {
        pointsAwarded: 0,
        errorValue: 16,
        exactScore: false,
        differenceScore: 16,
      },
    });
  });

  it("returns 404 when match is not found", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(null);

    const response = await POST(
      createResultRequest({
        matchId: 999,
        homeScore: 28,
        awayScore: 20,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(404);

    expect(body).toEqual({
      success: false,
      error: "Match not found",
    });

    expect(prisma.scoreAudit.create).not.toHaveBeenCalled();
    expect(prisma.match.update).not.toHaveBeenCalled();
  });

  it("returns 401 when authentication is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error("Authentication required")
    );

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

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

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(403);

    expect(body).toEqual({
      success: false,
      error: "Admin access required",
    });
  });

  it("uses previous snapshot to calculate rank movement", async () => {
    mockSuccessfulResultSave({
      latestSnapshot: {
        snapshotNumber: 4,
      },
      previousSnapshots: [
        {
          userId: 10,
          rank: 2,
        },
        {
          userId: 11,
          rank: 1,
        },
      ],
    });

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.snapshotNumber).toBe(5);

    expect(
      prisma.leaderboardSnapshot.findMany
    ).toHaveBeenCalledWith({
      where: {
        snapshotNumber: 4,
      },
    });

    expect(prisma.leaderboardSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 10,
          rank: 1,
          previousRank: 2,
          rankMovement: 1,
          snapshotNumber: 5,
        }),
      })
    );
  });

  it("completes tournament and upserts winner when all matches are completed", async () => {
    mockSuccessfulResultSave({
      completedMatches: 15,
      totalMatches: 15,
    });

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    expect(response.status).toBe(200);

    expect(prisma.tournament.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        status: "COMPLETED",
      },
    });

    expect(prisma.tournamentWinner.upsert).toHaveBeenCalledWith({
      where: {
        tournamentId: 1,
      },
      update: {
        userId: 10,
        finalPoints: 13,
      },
      create: {
        tournamentId: 1,
        userId: 10,
        finalPoints: 13,
      },
    });
  });

  it("does not complete tournament when fixtures remain", async () => {
    mockSuccessfulResultSave({
      completedMatches: 1,
      totalMatches: 15,
    });

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    expect(response.status).toBe(200);
    expect(prisma.tournament.update).not.toHaveBeenCalled();
    expect(prisma.tournamentWinner.upsert).not.toHaveBeenCalled();
  });

  it("handles draw result and exact drawn prediction", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      existingMatch as any
    );

    vi.mocked(prisma.scoreAudit.create).mockResolvedValueOnce({
      id: 900,
    } as any);

    vi.mocked(prisma.match.update).mockResolvedValueOnce({
      ...updatedMatch,
      actualHomeScore: 18,
      actualAwayScore: 18,
    } as any);

    vi.mocked(prisma.prediction.findMany).mockResolvedValueOnce([
      {
        id: 401,
        userId: 10,
        matchId: 101,
        predictedHomeScore: 18,
        predictedAwayScore: 18,
      },
    ] as any);

    vi.mocked(prisma.prediction.update).mockResolvedValue(
      {} as any
    );

    vi.mocked(prisma.user.findMany)
      .mockResolvedValueOnce([
        {
          id: 10,
          registrationOrder: 1,
          predictions: [
            {
              pointsAwarded: 13,
              errorValue: 0,
              exactScore: true,
              differenceScore: 0,
            },
          ],
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 10,
          totalPoints: 13,
          exactScores: 1,
          cumulativeError: 0,
          registrationOrder: 1,
          predictions: [
            {
              differenceScore: 0,
            },
          ],
        },
      ] as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    vi.mocked(
      prisma.leaderboardSnapshot.create
    ).mockResolvedValue({} as any);

    vi.mocked(prisma.match.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(15);

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 18,
        awayScore: 18,
      })
    );

    expect(response.status).toBe(200);

    expect(prisma.prediction.update).toHaveBeenCalledWith({
      where: {
        id: 401,
      },
      data: {
        pointsAwarded: 13,
        errorValue: 0,
        exactScore: true,
        differenceScore: -0,
      },
    });
  });

  it("returns 500 when score audit creation fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      existingMatch as any
    );

    vi.mocked(prisma.scoreAudit.create).mockRejectedValueOnce(
      new Error("Audit create failed")
    );

    const response = await POST(
      createResultRequest({
        matchId: 101,
        homeScore: 28,
        awayScore: 20,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to save result",
    });
  });

  it("returns 500 when request JSON parsing fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    const request = new Request(
      "http://localhost/api/admin/results",
      {
        method: "POST",
        body: "{bad-json",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to save result",
    });
  });
});