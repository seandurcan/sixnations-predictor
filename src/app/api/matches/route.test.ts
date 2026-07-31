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
    match: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockMatches = [
  {
    id: 101,
    matchNumber: 1,
    round: 1,
    kickoffTime: "2027-01-29T14:15:00.000Z",
    completed: false,
    tournament: {
      id: 1,
      predictionLockAt:
        "2027-01-29T14:15:00.000Z",
    },
    homeTeam: {
      name: "Ireland",
      shortCode: "IRE",
    },
    awayTeam: {
      name: "France",
      shortCode: "FRA",
    },
  },
];

describe("GET /api/matches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns matches ordered by match number with teams included", async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce(
      mockMatches as any
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual(mockMatches);

    expect(prisma.match.findMany).toHaveBeenCalledWith({
      orderBy: {
        matchNumber: "asc",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: {
          select: {
            id: true,
            predictionLockAt: true,
          },
        },
      },
    });
  });

  it("returns empty array when no matches exist", async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce([]);

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("throws when database query fails because route has no local error handling", async () => {
    vi.mocked(prisma.match.findMany).mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    await expect(GET()).rejects.toThrow("Database unavailable");
  });
});