import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import AdminDashboardPage from "./page";

// Mock next/navigation router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockDashboardData = {
  success: true,
  metrics: {
    totalUsers: 25,
    totalPredictions: 120,
    activeTournaments: 1,
  },
  tournamentStatus: {
    currentRound: 3,
    status: "active",
  },
  leaderboard: [
    { rank: 1, user: { name: "Test User" }, points: 45 }
  ],
  recentAudit: [],
  winner: null,
};

describe("AdminDashboardPage", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    originalLocation = window.location;

    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/admin/dashboard")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDashboardData),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      window.location = originalLocation;
    } catch {
      // Ignore if window.location cannot be reassigned back directly
    }
  });

  it("fetches admin dashboard data on render", async () => {
    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/dashboard")
      );
    });
  });

  it("redirects to login when dashboard API returns 401", async () => {
    // Safely mock window.location to prevent "Not implemented: navigation to another Document"
    try {
      // @ts-ignore
      delete window.location;
      window.location = { ...originalLocation, href: "", assign: vi.fn(), replace: vi.fn() };
    } catch {
      // Fallback if window properties are non-configurable
    }

    vi.mocked(global.fetch).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      } as Response)
    );

    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      const redirectedToLogin = 
        mockPush.mock.calls.some(call => call[0]?.includes("/login")) ||
        (window.location && window.location.href && window.location.href.includes("/login"));
      
      expect(redirectedToLogin).toBe(true);
    });
  });
});