import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import DashboardPage from "./page";

const mockUser = {
  id: 1,
  firstName: "Sean",
  lastName: "Durcan",
  email: "sean@example.com",
  role: "USER",
};

const mockLeaderboardRows = [
  {
    id: 1,
    firstName: "Sean",
    lastName: "Durcan",
    rank: 3,
    rankMovement: 2,
    totalPoints: 42,
    differenceScore: 8,
    exactScores: 3,
    cumulativeError: 18,
  },
  {
    id: 2,
    firstName: "Aoife",
    lastName: "Murphy",
    rank: 1,
    rankMovement: 0,
    totalPoints: 51,
    differenceScore: 4,
    exactScores: 5,
    cumulativeError: 12,
  },
  {
    id: 3,
    firstName: "Liam",
    lastName: "Byrne",
    rank: 2,
    rankMovement: -1,
    totalPoints: 47,
    differenceScore: 6,
    exactScores: 4,
    cumulativeError: 15,
  },
];

const mockLeaderboardRowsDownwardMovement = [
  {
    ...mockLeaderboardRows[0],
    rankMovement: -2,
  },
];

const mockLeaderboardRowsNoMovement = [
  {
    ...mockLeaderboardRows[0],
    rankMovement: 0,
  },
];

const mockLeaderboardRowsNullMovement = [
  {
    ...mockLeaderboardRows[0],
    rankMovement: null,
  },
];

const mockLeaderboardRowsWithoutCurrentUser = [
  {
    id: 99,
    firstName: "Other",
    lastName: "Player",
    rank: 1,
    rankMovement: 0,
    totalPoints: 60,
    differenceScore: 2,
    exactScores: 6,
    cumulativeError: 9,
  },
];

const mockMatches = [
  {
    id: 101,
    round: 1,
    completed: true,
    kickoffTime: "2027-01-29T14:15:00.000Z",
    actualHomeScore: 28,
    actualAwayScore: 20,
    homeTeam: {
      name: "Ireland",
      shortCode: "IRE",
    },
    awayTeam: {
      name: "France",
      shortCode: "FRA",
    },
  },
  {
    id: 102,
    round: 1,
    completed: false,
    kickoffTime: "2027-01-30T16:45:00.000Z",
    homeTeam: {
      name: "Scotland",
      shortCode: "SCO",
    },
    awayTeam: {
      name: "England",
      shortCode: "ENG",
    },
  },
  {
    id: 103,
    round: 2,
    completed: false,
    kickoffTime: "2027-02-05T15:00:00.000Z",
    homeTeam: {
      name: "Wales",
      shortCode: "WAL",
    },
    awayTeam: {
      name: "Italy",
      shortCode: "ITA",
    },
  },
];

const mockUnsortedMatches = [
  mockMatches[2],
  mockMatches[0],
  mockMatches[1],
];

const mockCompletedOnlyMatches = [
  {
    id: 201,
    round: 1,
    completed: true,
    kickoffTime: "2027-01-29T14:15:00.000Z",
    actualHomeScore: 28,
    actualAwayScore: 20,
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

const mockNoCompletedMatches = [
  {
    id: 301,
    round: 1,
    completed: false,
    kickoffTime: "2027-01-30T16:45:00.000Z",
    homeTeam: {
      name: "Scotland",
      shortCode: "SCO",
    },
    awayTeam: {
      name: "England",
      shortCode: "ENG",
    },
  },
];

const mockPredictions = [
  {
    id: 401,
    matchId: 101,
    predictedHomeScore: 24,
    predictedAwayScore: 18,
    pointsAwarded: 4,
    differenceScore: 6,
    updatedAt: "2027-01-29T19:00:00.000Z",
    match: mockMatches[0],
  },
  {
    id: 402,
    matchId: 102,
    predictedHomeScore: 18,
    predictedAwayScore: 25,
    pointsAwarded: 0,
    differenceScore: 0,
    updatedAt: "2027-01-28T18:00:00.000Z",
    match: mockMatches[1],
  },
];

const mockOlderOnlyPrediction = [
  {
    id: 501,
    matchId: 101,
    predictedHomeScore: 21,
    predictedAwayScore: 19,
    pointsAwarded: 2,
    differenceScore: 8,
    updatedAt: "2027-01-27T12:00:00.000Z",
    match: mockMatches[0],
  },
];

function mockSuccessfulDashboardLoad({
  user = mockUser,
  leaderboardRows = mockLeaderboardRows,
  matches = mockMatches,
  predictions = mockPredictions,
}: {
  user?: any;
  leaderboardRows?: any[];
  matches?: any[];
  predictions?: any[];
} = {}) {
  vi.mocked(global.fetch)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user,
      }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: leaderboardRows,
      }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => matches,
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => predictions,
    } as Response);
}

describe("DashboardPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn();

    Object.defineProperty(window, "location", {
      value: {
        href: "",
        assign: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("renders loading state before dashboard data loads", () => {
    vi.mocked(global.fetch).mockReturnValue(
      new Promise(() => {}) as Promise<Response>
    );

    render(<DashboardPage />);

    expect(
      screen.getByText("Loading your dashboard...")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Loading dashboard...")
    ).toBeInTheDocument();
  });

  it("redirects to login when auth request is not ok", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        authenticated: false,
      }),
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when user is unauthenticated", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: false,
      }),
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when auth API throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Auth API unavailable")
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when leaderboard API throws", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: mockUser,
        }),
      } as Response)
      .mockRejectedValueOnce(
        new Error("Leaderboard API unavailable")
      );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/leaderboard?page=1&pageSize=500"
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("redirects to login when matches API throws", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: mockUser,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockLeaderboardRows,
        }),
      } as Response)
      .mockRejectedValueOnce(
        new Error("Matches API unavailable")
      );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledWith("/api/matches");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("redirects to login when predictions API throws", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: mockUser,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockLeaderboardRows,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatches,
      } as Response)
      .mockRejectedValueOnce(
        new Error("Predictions API unavailable")
      );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledWith("/api/predictions/list");
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("fetches all dashboard data on successful load", async () => {
    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Dashboard",
      })
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/leaderboard?page=1&pageSize=500"
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/matches");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/predictions/list"
    );

    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("renders personalised welcome subtitle with rank position", async () => {
    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByText("Welcome Sean · Ranked #3 of 3 players")
    ).toBeInTheDocument();
  });

  it("renders fallback welcome subtitle when current user is not on leaderboard", async () => {
    mockSuccessfulDashboardLoad({
      leaderboardRows: mockLeaderboardRowsWithoutCurrentUser,
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Welcome Sean")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/Ranked #/i)
    ).not.toBeInTheDocument();
  });

  it("renders dashboard stat cards", async () => {
    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByText("Current Rank")
    ).toBeInTheDocument();

    expect(
      screen.getByText("#3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Rank Movement")
    ).toBeInTheDocument();

    expect(
      screen.getByText("↑ 2")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Total Points")
    ).toBeInTheDocument();

    expect(
      screen.getByText("42")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Difference Score")
    ).toBeInTheDocument();

    expect(
      screen.getByText("8")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Exact Scores")
    ).toBeInTheDocument();

    expect(
      screen.getByText("3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 / 3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Players")
    ).toBeInTheDocument();
  });

  it("renders downward rank movement", async () => {
    mockSuccessfulDashboardLoad({
      leaderboardRows: mockLeaderboardRowsDownwardMovement,
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("↓ 2")
    ).toBeInTheDocument();
  });

  it("renders unchanged rank movement", async () => {
    mockSuccessfulDashboardLoad({
      leaderboardRows: mockLeaderboardRowsNoMovement,
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("→")
    ).toBeInTheDocument();
  });

  it("renders dash for missing rank movement", async () => {
    mockSuccessfulDashboardLoad({
      leaderboardRows: mockLeaderboardRowsNullMovement,
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("-")
    ).toBeInTheDocument();
  });

  it("renders dashboard action buttons", async () => {
    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByRole("button", {
        name: "Make Predictions",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "View Leaderboard",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "View Fixtures",
      })
    ).toBeInTheDocument();
  });

  it("navigates to predictions from action button", async () => {
    const user = userEvent.setup();

    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByRole("button", {
        name: "Make Predictions",
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Make Predictions",
      })
    );

    expect(window.location.href).toBe("/predictions");
  });

  it("navigates to leaderboard from action button", async () => {
    const user = userEvent.setup();

    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByRole("button", {
        name: "View Leaderboard",
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "View Leaderboard",
      })
    );

    expect(window.location.href).toBe("/leaderboard");
  });

  it("navigates to fixtures from action button", async () => {
    const user = userEvent.setup();

    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByRole("button", {
        name: "View Fixtures",
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "View Fixtures",
      })
    );

    expect(window.location.href).toBe("/");
  });

  it("renders next match card with Irish formatted date and countdown", async () => {
    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByText("Next Match")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Scotland vs England")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Round 1")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/30 Jan 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/16:45/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Time until kick-off")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Predict This Match",
      })
    ).toBeInTheDocument();
  });

  it("selects the earliest upcoming match when matches are unsorted", async () => {
    mockSuccessfulDashboardLoad({
      matches: mockUnsortedMatches,
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Scotland vs England")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Wales vs Italy")
    ).not.toBeInTheDocument();
  });

  it("navigates to predictions from predict this match button", async () => {
    const user = userEvent.setup();

    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByRole("button", {
        name: "Predict This Match",
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Predict This Match",
      })
    );

    expect(window.location.href).toBe("/predictions");
  });

  it("renders tournament complete when there are no upcoming matches", async () => {
    mockSuccessfulDashboardLoad({
      matches: mockCompletedOnlyMatches,
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Tournament Complete")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Time until kick-off")
    ).not.toBeInTheDocument();
  });

  it("renders latest result card with last completed match", async () => {
    mockSuccessfulDashboardLoad();

    render(<DashboardPage />);

    expect(
      await screen.findByText("Latest Result")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Ireland 28 - 20 France/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Points Earned:")
    ).toBeInTheDocument();

    expect(
      screen.getByText("4")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Difference Score:")
    ).toBeInTheDocument();

    expect(
      screen.getByText("6")
    ).toBeInTheDocument();
  });

  it("renders no completed matches when there are no results", async () => {
    mockSuccessfulDashboardLoad({
      matches: mockNoCompletedMatches,
      predictions: [],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("No completed matches")
    ).toBeInTheDocument();
  });

  it("renders latest result without prediction details when no predictions exist", async () => {
    mockSuccessfulDashboardLoad({
      predictions: [],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText(/Ireland 28 - 20 France/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Points Earned:")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Difference Score:")
    ).not.toBeInTheDocument();
  });

  it("uses most recently updated prediction for latest result details", async () => {
    mockSuccessfulDashboardLoad({
      predictions: [
        ...mockOlderOnlyPrediction,
        ...mockPredictions,
      ],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Points Earned:")
    ).toBeInTheDocument();

    expect(
      screen.getByText("4")
    ).toBeInTheDocument();

    expect(
      screen.getByText("6")
    ).toBeInTheDocument();
  });

  it("renders zero statistics when current user has no leaderboard row", async () => {
    mockSuccessfulDashboardLoad({
      leaderboardRows: mockLeaderboardRowsWithoutCurrentUser,
      predictions: [],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Current Rank")
    ).toBeInTheDocument();

    expect(
      screen.getByText("#-")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("0")[0]
    ).toBeInTheDocument();
  });

  it("renders fallback player welcome when user has no first name", async () => {
    mockSuccessfulDashboardLoad({
      user: {
        id: 1,
        email: "player@example.com",
        role: "USER",
      },
      leaderboardRows: [
        {
          ...mockLeaderboardRows[0],
          id: 1,
        },
      ],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText(/Welcome Player/i)
    ).toBeInTheDocument();
  });

  it("handles empty leaderboard response", async () => {
    mockSuccessfulDashboardLoad({
      leaderboardRows: [],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Players")
    ).toBeInTheDocument();

    expect(
      screen.getByText("#-")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("0")[0]
    ).toBeInTheDocument();
  });

  it("handles empty matches and predictions response", async () => {
    mockSuccessfulDashboardLoad({
      matches: [],
      predictions: [],
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Tournament Complete")
    ).toBeInTheDocument();

    expect(
      screen.getByText("No completed matches")
    ).toBeInTheDocument();

    expect(
      screen.getByText("0 / 0")
    ).toBeInTheDocument();
  });
});