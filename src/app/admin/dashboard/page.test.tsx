import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AdminDashboardPage from "./page";

const mockDashboardData = {
  success: true,
  metrics: {
    userCount: 35,
    verifiedUserCount: 35,
    predictionCount: 30,
    playersWithPredictions: 30,
    completedFixtures: 0,
    remainingFixtures: 15,
    totalFixtures: 15,
  },
};

describe("AdminDashboardPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDashboardData,
    } as Response);

    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        href: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("loads dashboard data without caching stale zeroes", async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/dashboard",
        { cache: "no-store" }
      );
    });
  });

  it("renders the nested API metrics instead of nonexistent top-level fields", async () => {
    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Total Users")
    ).toBeInTheDocument();

    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("Matches Remaining")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Completed Matches")).toBeInTheDocument();
    expect(screen.getByText("Players with Predictions")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("does not silently replace a server error with zero-valued cards", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: "Database unavailable",
      }),
    } as Response);

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Database unavailable")
    ).toBeInTheDocument();

    expect(screen.queryByText("Total Users")).not.toBeInTheDocument();
  });
});
