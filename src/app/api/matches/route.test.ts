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

vi.mock("@/lib/liveScoring", () => ({
  syncLiveScores: vi.fn().mockResolvedValue({ checked: true }),
  enrichMatchesWithLiveScoreInfo: vi.fn(async (matches) => matches),
}));

vi.mock("@/lib/currentTournament", () => ({
  getTournamentByIdOrCurrent: vi.fn().mockResolvedValue({
    id: 1,
    name: "Six Nations Championship",
    year: 2027,
  }),
}));

import { prisma } from "@/lib/prisma";

const mockMatches = [
  {
    id: 101,
    matchNumber: 1,
    round: 1,
    kickoffTime: new Date("2027-01-29T14:15:00.000Z"),
    completed: false,
    tournament: {
      id: 1,
      name: "Six Nations Championship",
      year: 2027,
      firstKickoff: new Date("2027-01-29T14:15:00.000Z"),
      predictionLockAt: new Date("2027-01-29T14:14:00.000Z"),
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

  it("returns selected competition matches ordered by match number", async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce(
      mockMatches as any
    );

    const response = await GET(
      new Request("http://localhost/api/matches?tournamentId=1")
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body[0]).toEqual(expect.objectContaining({
      id: 101,
      matchNumber: 1,
      predictionLockAt: "2027-01-29T14:14:00.000Z",
    }));

    expect(prisma.match.findMany).toHaveBeenCalledWith({
      where: { tournamentId: 1 },
      orderBy: { matchNumber: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: {
          select: {
            id: true,
            name: true,
            year: true,
            firstKickoff: true,
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
