import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";

const mockCurrentUser = {
  id: 1,
  firstName: "Sean",
  lastName: "Durcan",
  email: "sean@example.com",
  role: "USER",
  totalPoints: 42,
};

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns authenticated user when session exists", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(
      mockCurrentUser as any
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      authenticated: true,
      user: {
        id: 1,
        firstName: "Sean",
        lastName: "Durcan",
        email: "sean@example.com",
        role: "USER",
        totalPoints: 42,
      },
    });
  });

  it("returns 401 when no user is authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
      authenticated: false,
    });
  });

  it("returns 500 when getCurrentUser throws", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(
      new Error("Session lookup failed")
    );

    const response = await GET();

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      authenticated: false,
      error: "Failed to retrieve current user",
    });
  });
});