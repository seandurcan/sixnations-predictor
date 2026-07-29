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
    },
    prediction: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const mockUser = {
  id: 1,
  email: "sean@example.com",
};

const futureMatch = {
  id: 101,
  kickoffTime: "2099-01-29T14:15:00.000Z",
};

const pastMatch = {
  id: 102,
  kickoffTime: "2020-01-29T14:15:00.000Z",
};

const mockPrediction = {
  id: 301,
  userId: 1,
  matchId: 101,
  predictedHomeScore: 24,
  predictedAwayScore: 18,
};

function createPredictionRequest(body: any) {
  return new Request("http://localhost/api/predictions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("POST /api/predictions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates or updates prediction for authenticated user before kickoff", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      futureMatch as any
    );

    vi.mocked(prisma.prediction.upsert).mockResolvedValueOnce(
      mockPrediction as any
    );

    const response = await POST(
      createPredictionRequest({
        matchId: 101,
        homeScore: 24,
        awayScore: 18,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      success: true,
      prediction: mockPrediction,
    });

    expect(prisma.prediction.upsert).toHaveBeenCalledWith({
      where: {
        userId_matchId: {
          userId: 1,
          matchId: 101,
        },
      },
      update: {
        predictedHomeScore: 24,
        predictedAwayScore: 18,
      },
      create: {
        userId: 1,
        matchId: 101,
        predictedHomeScore: 24,
        predictedAwayScore: 18,
      },
    });
  });

  it("returns 404 when match does not exist", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(null);

    const response = await POST(
      createPredictionRequest({
        matchId: 999,
        homeScore: 24,
        awayScore: 18,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(404);

    expect(body).toEqual({
      success: false,
      error: "Match not found",
    });

    expect(prisma.prediction.upsert).not.toHaveBeenCalled();
  });

  it("returns 403 when match has already kicked off", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      pastMatch as any
    );

    const response = await POST(
      createPredictionRequest({
        matchId: 102,
        homeScore: 24,
        awayScore: 18,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(403);

    expect(body).toEqual({
      success: false,
      error:
        "Predictions are locked because the match has already kicked off",
    });

    expect(prisma.prediction.upsert).not.toHaveBeenCalled();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(
      new Error("Authentication required")
    );

    const response = await POST(
      createPredictionRequest({
        matchId: 101,
        homeScore: 24,
        awayScore: 18,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
      success: false,
      error: "Authentication required",
    });
  });

  it("allows zero-zero prediction payload", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      futureMatch as any
    );

    vi.mocked(prisma.prediction.upsert).mockResolvedValueOnce({
      ...mockPrediction,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
    } as any);

    const response = await POST(
      createPredictionRequest({
        matchId: 101,
        homeScore: 0,
        awayScore: 0,
      })
    );

    expect(response.status).toBe(200);

    expect(prisma.prediction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          predictedHomeScore: 0,
          predictedAwayScore: 0,
        },
        create: expect.objectContaining({
          predictedHomeScore: 0,
          predictedAwayScore: 0,
        }),
      })
    );
  });

  it("returns 500 when prediction upsert fails", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      futureMatch as any
    );

    vi.mocked(prisma.prediction.upsert).mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await POST(
      createPredictionRequest({
        matchId: 101,
        homeScore: 24,
        awayScore: 18,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to save prediction",
    });
  });

  it("returns 500 when request JSON parsing fails", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    const request = new Request(
      "http://localhost/api/predictions",
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
      error: "Failed to save prediction",
    });
  });
});