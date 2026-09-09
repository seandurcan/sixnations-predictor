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

import { prisma } from "@/lib/prisma";

function request() {
  return new Request(
    "http://localhost/api/leaderboard?page=1&pageSize=10"
  );
}

const user = (
  id: number,
  overrides: any = {}
) => ({
  id,
  firstName: `Player${id}`,
  lastName: "Test",
  totalPoints: 10,
  exactScores: 1,
  cumulativeError: 20,
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
});

describe(
  "GET /api/leaderboard",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      vi.mocked(
        prisma.leaderboardSnapshot.findFirst
      ).mockResolvedValue(null);
    });

    it("uses correct results before exact scores and aggregate error", async () => {
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

    it("uses exact scores before correct margins and aggregate error", async () => {
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

    it("uses correct margins before aggregate error", async () => {
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
  }
);