import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    match: { findMany: vi.fn(), count: vi.fn() },
    leaderboardSnapshot: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/currentTournament", () => ({
  getViewableTournamentByIdOrCurrent: vi.fn(),
}));
vi.mock("@/lib/liveScoring", () => ({
  syncLiveScores: vi.fn().mockResolvedValue({ providerQueries: 0 }),
}));

import { prisma } from "@/lib/prisma";
import { getViewableTournamentByIdOrCurrent } from "@/lib/currentTournament";

function request() {
  return new Request("http://localhost/api/leaderboard?page=1&pageSize=10");
}

const prediction = (overrides: any = {}) => ({
  pointsAwarded: 1,
  errorValue: 10,
  exactScore: false,
  differenceScore: 0,
  correctMargin: false,
  correctResult: true,
  ...overrides,
});

const user = (id: number, overrides: any = {}) => ({
  id,
  firstName: `Player${id}`,
  lastName: "Test",
  competitionEntries: [{ tournamentPointsGuess: null }],
  registrationOrder: id,
  predictionSubmittedAt: null,
  predictions: [prediction()],
  ...overrides,
});

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.leaderboardSnapshot.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.leaderboardSnapshot.findMany).mockResolvedValue([]);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);
    vi.mocked(prisma.match.count).mockResolvedValue(15);
    vi.mocked(getViewableTournamentByIdOrCurrent).mockResolvedValue({
      id: 7,
    } as never);
  });

  it("uses Correct Wins immediately after Points Total", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, differenceScore: 50 }),
          prediction({ pointsAwarded: 0, correctResult: true, differenceScore: 50 }),
        ],
      }),
      user(2, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, differenceScore: -999 }),
          prediction({ pointsAwarded: 0, correctResult: false, differenceScore: -999 }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(1);
  });

  it("uses Perfect Scores after Correct Wins", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, exactScore: false, correctMargin: true }),
        ],
      }),
      user(2, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, exactScore: true, correctMargin: false }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("uses Correct Margins after Perfect Scores", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, exactScore: false, correctMargin: false, differenceScore: -999 }),
        ],
      }),
      user(2, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, exactScore: false, correctMargin: true, differenceScore: 999 }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("uses lowest Prediction Delta as the final tie-break", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, exactScore: false, correctMargin: false, differenceScore: 8 }),
        ],
      }),
      user(2, {
        predictions: [
          prediction({ pointsAwarded: 1, correctResult: true, exactScore: false, correctMargin: false, differenceScore: -4 }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("keeps fully tied entrants joint", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([user(1), user(2)] as any);

    const body = await (await GET(request())).json();
    expect(body.data.map((entry: any) => entry.rank)).toEqual([1, 1]);
  });

  it("loads only completed-match predictions for entered participants", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    await GET(request());

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        competitionEntries: {
          some: { tournamentId: 7, status: "ENTERED" },
        },
      },
      include: {
        predictions: {
          where: {
            match: {
              tournamentId: 7,
              completed: true,
            },
          },
        },
        competitionEntries: {
          where: { tournamentId: 7 },
          take: 1,
        },
      },
    });
  });
});
