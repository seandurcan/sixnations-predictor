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

  it("uses lowest cumulative Prediction Delta immediately after total points", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, { predictions: [prediction({ errorValue: 50, differenceScore: -5 })] }),
      user(2, {
        predictions: [
          prediction({ errorValue: 1, differenceScore: 10, exactScore: true, pointsAwarded: 1 }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(1);
  });

  it("uses exact scores before correct margins", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        predictions: [
          prediction({ errorValue: 10, exactScore: false, correctMargin: true }),
        ],
      }),
      user(2, {
        predictions: [
          prediction({ errorValue: 10, exactScore: true, correctMargin: false }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("uses correct margins before correct results", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        predictions: [
          prediction({ errorValue: 10, correctMargin: false, correctResult: true }),
          prediction({ errorValue: 0, pointsAwarded: 0, correctResult: true }),
        ],
      }),
      user(2, {
        predictions: [
          prediction({ errorValue: 10, correctMargin: true, correctResult: true }),
          prediction({ errorValue: 0, pointsAwarded: 0, correctResult: false }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("uses correct results before the final total-points guess tie-break", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, {
        competitionEntries: [{ tournamentPointsGuess: 500 }],
        predictions: [
          prediction({ errorValue: 10, correctResult: true }),
          prediction({ errorValue: 0, pointsAwarded: 0, correctResult: true }),
        ],
      }),
      user(2, {
        competitionEntries: [{ tournamentPointsGuess: 100 }],
        predictions: [
          prediction({ errorValue: 10, correctResult: true }),
          prediction({ errorValue: 0, pointsAwarded: 0, correctResult: false }),
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(1);
  });

  it("uses closest total-points guess only when the competition is complete", async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      { actualHomeScore: 20, actualAwayScore: 10 },
    ] as any);
    vi.mocked(prisma.match.count).mockResolvedValue(1);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, { competitionEntries: [{ tournamentPointsGuess: 31 }] }),
      user(2, { competitionEntries: [{ tournamentPointsGuess: 40 }] }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(1);
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
