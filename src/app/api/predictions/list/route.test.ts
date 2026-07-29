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
    prediction: {
      findMany: vi.fn(),
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

const mockPredictions = [
  {
    id: 301,
    userId: 1,
    matchId: 101,
    predictedHomeScore: 24,
    predictedAwayScore: 18,
    match: {
      id: 101,
      homeTeam: {
        name: "Ireland",
        shortCode: "IRE",
      },
      awayTeam: {
        name: "France",
        shortCode: "FRA",
      },
    },
  },
];

describe("GET /api/predictions/list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns predictions for authenticated user", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.prediction.findMany).mockResolvedValueOnce(
      mockPredictions as any
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual(mockPredictions);

    expect(prisma.prediction.findMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: {
        matchId: "asc",
      },
    });
  });

  it("returns empty array when user has no predictions", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.prediction.findMany).mockResolvedValueOnce([]);

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(
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

  it("returns 500 when database query fails", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUser as any);

    vi.mocked(prisma.prediction.findMany).mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load predictions",
    });
  });
});