import {
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
      findMany: vi.fn(),
    },
    leaderboardSnapshot: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/currentTournament", () => ({ getTournamentByIdOrCurrent: vi.fn() }));
vi.mock("@/lib/liveScoring", () => ({ syncLiveScores: vi.fn().mockResolvedValue({ providerQueries: 0 }) }));

import { prisma } from "@/lib/prisma";
import { getTournamentByIdOrCurrent } from "@/lib/currentTournament";

function request() {
  return new Request(
    "http://localhost/api/leaderboard?page=1&pageSize=10"
  );
}

const user = (id: number, overrides: any = {}) => {
  const totalPoints = overrides.totalPoints ?? 10;
  const exactScores = overrides.exactScores ?? 1;
  const cumulativeError = overrides.cumulativeError ?? 20;
  return {
    id,
    firstName: `Player${id}`,
    lastName: "Test",
    totalPoints,
    exactScores,
    cumulativeError,
    competitionEntries: [{ totalPoints, exactScores, cumulativeError }],
    registrationOrder: id,
    predictionSubmittedAt: null,
    predictions: [
      {
        differenceScore: 0,
        correctMargin: true,
        correctResult: true,
      },
    ],
    ...overrides,
  };
};

describe(
  "GET /api/leaderboard",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      vi.mocked(
        prisma.leaderboardSnapshot.findFirst
      ).mockResolvedValue(null);
      vi.mocked(getTournamentByIdOrCurrent).mockResolvedValue({ id: 7 } as never);
    });

    it("uses correct wins before perfect scores and prediction delta", async () => {
      vi.mocked(
        prisma.user.findMany
      ).mockResolvedValue([
        user(1, {
          exactScores: 5,
          cumulativeError: 1,
          predictions: [],
        }),
        user(2, {
          exactScores: 0,
          cumulativeError: 99,
          predictions: [
            {
              differenceScore: 0,
              correctMargin: false,
              correctResult: true,
            },
            {
              differenceScore: 0,
              correctMargin: false,
              correctResult: true,
            },
          ],
        }),
      ] as any);

      const body =
        await (
          await GET(request())
        ).json();

      expect(
        body.data[0].id
      ).toBe(2);
    });

    it("uses perfect scores before correct margins and prediction delta", async () => {
      vi.mocked(
        prisma.user.findMany
      ).mockResolvedValue([
        user(1, {
          exactScores: 1,
          cumulativeError: 1,
        }),
        user(2, {
          exactScores: 2,
          cumulativeError: 99,
        }),
      ] as any);

      const body =
        await (
          await GET(request())
        ).json();

      expect(
        body.data[0].id
      ).toBe(2);
    });

    it("uses correct margins before prediction delta", async () => {
      vi.mocked(
        prisma.user.findMany
      ).mockResolvedValue([
        user(1, {
          cumulativeError: 1,
          predictions: [
            {
              differenceScore: 0,
              correctMargin: false,
              correctResult: true,
            },
          ],
        }),
        user(2, {
          cumulativeError: 99,
          predictions: [
            {
              differenceScore: 0,
              correctMargin: true,
              correctResult: true,
            },
          ],
        }),
      ] as any);

      const body =
        await (
          await GET(request())
        ).json();

      expect(
        body.data[0].id
      ).toBe(2);
    });

    it("keeps fully tied entrants joint", async () => {
      vi.mocked(
        prisma.user.findMany
      ).mockResolvedValue([
        user(1),
        user(2),
      ] as any);

      const body =
        await (
          await GET(request())
        ).json();

      expect(
        body.data.map(
          (entry: any) =>
            entry.rank
        )
      ).toEqual([1, 1]);
    });

    it("loads only entered participants for the selected competition", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await GET(request());

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, competitionEntries: { some: { tournamentId: 7, status: "ENTERED" } } },
        include: {
          predictions: { where: { match: { tournamentId: 7 } } },
          competitionEntries: { where: { tournamentId: 7 }, take: 1 },
        },
      });
    });
  }
);
