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

const mockUsers = [
  {
    id: 1,
    firstName: "Aoife",
    lastName: "Murphy",
    totalPoints: 40,
    exactScores: 3,
    cumulativeError: 12,
    registrationOrder: 1,
    predictions: [
      {
        id: 101,
        differenceScore: -4,
      },
      {
        id: 102,
        differenceScore: 2,
      },
    ],
  },
  {
    id: 2,
    firstName: "Sean",
    lastName: "Durcan",
    totalPoints: 40,
    exactScores: 2,
    cumulativeError: 10,
    registrationOrder: 2,
    predictions: [
      {
        id: 103,
        differenceScore: 1,
      },
      {
        id: 104,
        differenceScore: 3,
      },
    ],
  },
  {
    id: 3,
    firstName: "Liam",
    lastName: "Byrne",
    totalPoints: 35,
    exactScores: 5,
    cumulativeError: 8,
    registrationOrder: 3,
    predictions: [
      {
        id: 105,
        differenceScore: 0,
      },
    ],
  },
  {
    id: 4,
    firstName: "Niamh",
    lastName: "Kelly",
    totalPoints: 20,
    exactScores: 1,
    cumulativeError: 30,
    registrationOrder: 4,
    predictions: [],
  },
];

const mockLatestSnapshot = {
  id: 999,
  snapshotNumber: 3,
};

const mockLatestSnapshots = [
  {
    id: 201,
    userId: 1,
    previousRank: 2,
    rankMovement: 1,
    snapshotNumber: 3,
  },
  {
    id: 202,
    userId: 2,
    previousRank: 1,
    rankMovement: -1,
    snapshotNumber: 3,
  },
];

function createRequest(
  url = "http://localhost/api/leaderboard?page=1&pageSize=10"
) {
  return new Request(url);
}

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sorted leaderboard data with pagination metadata", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(mockLatestSnapshot as any);

    vi.mocked(
      prisma.leaderboardSnapshot.findMany
    ).mockResolvedValueOnce(mockLatestSnapshots as any);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.totalRecords).toBe(4);
    expect(body.totalPages).toBe(1);
    expect(body.data).toHaveLength(4);

    expect(body.data[0]).toMatchObject({
      id: 1,
      firstName: "Aoife",
      lastName: "Murphy",
      rank: 1,
      totalPoints: 40,
      differenceScore: -2,
      previousRank: 2,
      rankMovement: 1,
    });

    expect(body.data[1]).toMatchObject({
      id: 2,
      firstName: "Sean",
      lastName: "Durcan",
      rank: 2,
      totalPoints: 40,
      differenceScore: 4,
      previousRank: 1,
      rankMovement: -1,
    });
  });

  it("uses total points as first sort priority", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.data[0].totalPoints).toBeGreaterThanOrEqual(
      body.data[2].totalPoints
    );
  });

  it("uses difference score as second sort priority", async () => {
    const tiedUsers = [
      {
        ...mockUsers[0],
        totalPoints: 40,
        predictions: [
          {
            id: 1,
            differenceScore: 10,
          },
        ],
      },
      {
        ...mockUsers[1],
        totalPoints: 40,
        predictions: [
          {
            id: 2,
            differenceScore: -3,
          },
        ],
      },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      tiedUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0].id).toBe(2);
    expect(body.data[0].differenceScore).toBe(-3);
  });

  it("uses exact scores as third sort priority", async () => {
    const tiedUsers = [
      {
        ...mockUsers[0],
        totalPoints: 40,
        exactScores: 1,
        cumulativeError: 10,
        predictions: [],
      },
      {
        ...mockUsers[1],
        totalPoints: 40,
        exactScores: 4,
        cumulativeError: 10,
        predictions: [],
      },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      tiedUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0].id).toBe(2);
    expect(body.data[0].exactScores).toBe(4);
  });

  it("uses cumulative error as fourth sort priority", async () => {
    const tiedUsers = [
      {
        ...mockUsers[0],
        totalPoints: 40,
        exactScores: 2,
        cumulativeError: 20,
        predictions: [],
      },
      {
        ...mockUsers[1],
        totalPoints: 40,
        exactScores: 2,
        cumulativeError: 5,
        predictions: [],
      },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      tiedUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0].id).toBe(2);
    expect(body.data[0].cumulativeError).toBe(5);
  });

  it("uses registration order as final sort priority", async () => {
    const tiedUsers = [
      {
        ...mockUsers[0],
        totalPoints: 40,
        exactScores: 2,
        cumulativeError: 10,
        registrationOrder: 2,
        predictions: [],
      },
      {
        ...mockUsers[1],
        totalPoints: 40,
        exactScores: 2,
        cumulativeError: 10,
        registrationOrder: 1,
        predictions: [],
      },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      tiedUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0].id).toBe(2);
    expect(body.data[0].registrationOrder).toBe(1);
  });

  it("returns paginated data", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(
      createRequest(
        "http://localhost/api/leaderboard?page=2&pageSize=2"
      )
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(2);
    expect(body.totalRecords).toBe(4);
    expect(body.totalPages).toBe(2);
    expect(body.data).toHaveLength(2);
  });

  it("defaults page and pageSize when query params are missing", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(
      createRequest("http://localhost/api/leaderboard")
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
  });

  it("returns at least one total page when there are no users", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalRecords).toBe(0);
    expect(body.totalPages).toBe(1);
    expect(body.data).toEqual([]);
  });

  it("does not load snapshot rows when no latest snapshot exists", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);

    expect(
      prisma.leaderboardSnapshot.findMany
    ).not.toHaveBeenCalled();
  });

  it("loads latest snapshot rows when latest snapshot exists", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(
      mockUsers as any
    );

    vi.mocked(
      prisma.leaderboardSnapshot.findFirst
    ).mockResolvedValueOnce(mockLatestSnapshot as any);

    vi.mocked(
      prisma.leaderboardSnapshot.findMany
    ).mockResolvedValueOnce(mockLatestSnapshots as any);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);

    expect(
      prisma.leaderboardSnapshot.findMany
    ).toHaveBeenCalledWith({
      where: {
        snapshotNumber: 3,
      },
    });
  });

  it("throws when user query fails because route has no local error handling", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValueOnce(
      new Error("User query failed")
    );

    await expect(GET(createRequest())).rejects.toThrow(
      "User query failed"
    );
  });
});