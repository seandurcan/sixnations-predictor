import { render, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import AdminDashboardPage from "./page";

const mockDashboardData = {
  metrics: {
    userCount: 42,
    verifiedUserCount: 37,
    predictionCount: 210,
    completedFixtures: 6,
    totalFixtures: 15,
    remainingFixtures: 9,
  },
  tournament: {
    id: 1,
    name: "Six Nations Predictor",
    year: 2027,
    status: "OPEN",
  },
  currentLeader: {
    id: 11,
    firstName: "Aoife",
    lastName: "Murphy",
    totalPoints: 48,
    exactScores: 4,
  },
  leaderboard: [
    {
      id: 11,
      firstName: "Aoife",
      lastName: "Murphy",
      totalPoints: 48,
    },
    {
      id: 12,
      firstName: "Sean",
      lastName: "Durcan",
      totalPoints: 43,
    },
    {
      id: 13,
      firstName: "Liam",
      lastName: "Byrne",
      totalPoints: 39,
    },
  ],
  winner: {
    id: 21,
    finalPoints: 88,
    user: {
      firstName: "Niamh",
      lastName: "Kelly",
    },
  },
  recentAudits: [
    {
      id: 301,
      matchId: 101,
      previousHome: null,
      previousAway: null,
      newHome: 28,
      newAway: 20,
      createdAt: "2027-01-29T18:30:00.000Z",
      adminUserId: 1,
      adminUser: {
        firstName: "Admin",
        lastName: "User",
      },
      match: {
        id: 101,
        homeTeam: {
          shortCode: "IRE",
        },
        awayTeam: {
          shortCode: "FRA",
        },
      },
    },
    {
      id: 302,
      matchId: 102,
      previousHome: 17,
      previousAway: 14,
      newHome: 24,
      newAway: 17,
      createdAt: "2027-01-30T20:15:00.000Z",
      adminUserId: 2,
      adminUser: null,
      match: {
        id: 102,
        homeTeam: {
          shortCode: "SCO",
        },
        awayTeam: {
          shortCode: "ENG",
        },
      },
    },
  ],
};

const mockDashboardDataNoWinner = {
  ...mockDashboardData,
  winner: null,
};

const mockDashboardDataNoLeader = {
  ...mockDashboardData,
  currentLeader: null,
};

const mockDashboardDataEmptyLeaderboard = {
  ...mockDashboardData,
  leaderboard: [],
};

const mockDashboardDataEmptyAudits = {
  ...mockDashboardData,
  recentAudits: [],
};

const mockDashboardDataAuditWithoutMatch = {
  ...mockDashboardData,
  recentAudits: [
    {
      id: 401,
      matchId: 999,
      previousHome: 10,
      previousAway: 8,
      newHome: 12,
      newAway: 11,
      createdAt: "2027-02-01T12:00:00.000Z",
      adminUserId: 5,
      adminUser: null,
      match: null,
    },
  ],
};

function mockSuccessfulDashboardLoad(
  data = mockDashboardData
) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  } as Response);
}

describe("AdminDashboardPage", () => {
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

    render(<AdminDashboardPage />);

    expect(
      screen.getByText("Loading dashboard...")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Loading tournament overview...")
    ).toBeInTheDocument();
  });

  it("fetches admin dashboard data on render", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Admin Dashboard",
      })
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/dashboard"
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when dashboard API returns 401", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/dashboard"
    );
  });

  it("redirects to dashboard when dashboard API returns 403", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    } as Response);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/dashboard"
    );
  });

  it("shows failed load state when dashboard API throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Admin dashboard API unavailable")
    );

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Failed to load dashboard.")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Admin Dashboard",
      })
    ).toBeInTheDocument();
  });

  it("renders metric cards", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Registered Users")
    ).toBeInTheDocument();

    expect(
      screen.getByText("42")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verified Users")
    ).toBeInTheDocument();

    expect(
      screen.getByText("37")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Predictions")
    ).toBeInTheDocument();

    expect(
      screen.getByText("210")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Fixtures Complete")
    ).toBeInTheDocument();

    expect(
      screen.getByText("6")
    ).toBeInTheDocument();

    expect(
      screen.getByText("of 15")
    ).toBeInTheDocument();
  });

  it("renders tournament status information", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Tournament Status")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Six Nations Predictor")
    ).toBeInTheDocument();

    expect(
      screen.getByText("2027")
    ).toBeInTheDocument();

    expect(
      screen.getByText("OPEN")
    ).toBeInTheDocument();

    expect(
      screen.getByText("9")
    ).toBeInTheDocument();
  });

  

  it("shows empty leader state when there is no current leader", async () => {
    mockSuccessfulDashboardLoad(
      mockDashboardDataNoLeader
    );

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Current Leader")
    ).toBeInTheDocument();

    expect(
      screen.getByText("No leaderboard data available.")
    ).toBeInTheDocument();
  });

it("renders current leader information", async () => {
  mockSuccessfulDashboardLoad();

  render(<AdminDashboardPage />);

  expect(
    await screen.findByText("Current Leader")
  ).toBeInTheDocument();

  expect(
    screen.getAllByText(/Aoife/i)[0]
  ).toBeInTheDocument();

  expect(
    screen.getAllByText(/Murphy/i)[0]
  ).toBeInTheDocument();

  expect(
    screen.getAllByText("48")[0]
  ).toBeInTheDocument();

  expect(
    screen.getAllByText("4")[0]
  ).toBeInTheDocument();
});

  it("renders top 10 leaderboard entries", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Top 10 Leaderboard")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/#1/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/#2/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/#3/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Sean/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Durcan/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Liam/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Byrne/i)
    ).toBeInTheDocument();
  });

  it("shows empty leaderboard message when leaderboard is empty", async () => {
    mockSuccessfulDashboardLoad(
      mockDashboardDataEmptyLeaderboard
    );

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Top 10 Leaderboard")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("No leaderboard data available.")[0]
    ).toBeInTheDocument();
  });

  it("renders tournament winner when winner exists", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Tournament Winner")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Niamh/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Kelly/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText("88")
    ).toBeInTheDocument();
  });

  it("renders tournament not completed when winner does not exist", async () => {
    mockSuccessfulDashboardLoad(
      mockDashboardDataNoWinner
    );

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Tournament Winner")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Tournament not yet completed.")
    ).toBeInTheDocument();
  });

  it("renders recent audit activity", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Recent Audit Activity")
    ).toBeInTheDocument();

    expect(
      screen.getByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("SCO v ENG")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Changed by Admin User/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Changed by Admin 2/i)
    ).toBeInTheDocument();
  });

  it("renders audit score changes", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Recent Audit Activity")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/- - - →/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/28 - 20/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/17 - 14 →/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/24 - 17/i)
    ).toBeInTheDocument();
  });

  it("renders audit dates using Irish date formatting", async () => {
    mockSuccessfulDashboardLoad();

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText(/29 Jan 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/18:30/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/30 Jan 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/20:15/i)
    ).toBeInTheDocument();
  });

  it("shows empty audit message when there is no recent audit activity", async () => {
    mockSuccessfulDashboardLoad(
      mockDashboardDataEmptyAudits
    );

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Recent Audit Activity")
    ).toBeInTheDocument();

    expect(
      screen.getByText("No audit activity found.")
    ).toBeInTheDocument();
  });

  it("handles audit records without match relationship", async () => {
    mockSuccessfulDashboardLoad(
      mockDashboardDataAuditWithoutMatch
    );

    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Recent Audit Activity")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Match 999")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Changed by Admin 5/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/01 Feb 2027/i)
    ).toBeInTheDocument();
  });
});