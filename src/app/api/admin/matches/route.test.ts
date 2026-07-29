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

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const mockAdmin = {
  id: 1,
  email: "admin@example.com",
  role: "ADMIN",
};

const mockMatches = [
  {
    id: 101,
    matchNumber: 1,
    round: 1,
    kickoffTime: "2027-01-29T14:15:00.000Z",
    completed: false,
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

describe("GET /api/admin/matches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns admin matches when admin is authenticated", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

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
      },
    });
  });

  it("returns 401 when authentication is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
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

  it("returns 403 when admin access is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error("Admin access required")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(403);

    expect(body).toEqual({
      success: false,
      error: "Admin access required",
    });
  });

  it("returns 500 when database query fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.match.findMany).mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load matches",
    });
  });
});