import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    leaderboardSnapshot: { findFirst: vi.fn(), findMany: vi.fn() },
    tournament: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

function request() {
  return new Request("http://localhost/api/leaderboard?page=1&pageSize=10");
}

const user = (id: number, overrides: any = {}) => ({
  id,
  firstName: `Player${id}`,
  lastName: "Test",
  totalPoints: 10,
  exactScores: 1,
  cumulativeError: 20,
  registrationOrder: id,
  predictionSubmittedAt: null,
  tournamentPointsGuess: 500,
  predictions: [
    { differenceScore: 0, correctMargin: true, correctResult: true },
  ],
  ...overrides,
});

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.leaderboardSnapshot.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tournament.findFirst).mockResolvedValue(null);
  });

  it("uses correct results before exact scores and aggregate error", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, { exactScores: 5, cumulativeError: 1, predictions: [] }),
      user(2, {
        exactScores: 0,
        cumulativeError: 99,
        predictions: [
          { differenceScore: 0, correctMargin: false, correctResult: true },
          { differenceScore: 0, correctMargin: false, correctResult: true },
        ],
      }),
    ] as any);

    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("uses exact scores before correct margins and aggregate error", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, { exactScores: 1, cumulativeError: 1 }),
      user(2, { exactScores: 2, cumulativeError: 99 }),
    ] as any);
    const body = await (await GET(request())).json();
    expect(body.data[0].id).toBe(2);
  });

  it("uses the tournament-total prediction only after the tournament is complete", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      user(1, { tournamentPointsGuess: 101 }),
      user(2, { tournamentPointsGuess: 120 }),
    ] as any);
    vi.mocked(prisma.tournament.findFirst).mockResolvedValue({
      id: 1,
      year: 2027,
      matches: [
        { completed: true, actualHomeScore: 50, actualAwayScore: 50 },
      ],
    } as any);

    const body = await (await GET(request())).json();
    expect(body.tournamentComplete).toBe(true);
    expect(body.actualTournamentPoints).toBe(100);
    expect(body.data[0].id).toBe(1);
    expect(body.data[0].tournamentPointsError).toBe(1);
  });

  it("keeps fully tied entrants joint", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([user(1), user(2)] as any);
    const body = await (await GET(request())).json();
    expect(body.data.map((x: any) => x.rank)).toEqual([1, 1]);
  });
});
