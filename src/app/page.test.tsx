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
import HomePage from "./page";

vi.mock("@/components/ui/CountdownTimer", () => ({
  default: ({
    targetDate,
    label,
  }: {
    targetDate: string | Date;
    label?: string;
  }) => (
    <div data-testid="countdown-timer">
      <div>{label ?? "Countdown"}</div>
      <div>{String(targetDate)}</div>
    </div>
  ),
}));

const mockMatches = [
  {
    id: 101,
    round: 1,
    completed: false,
    kickoffTime: "2027-01-29T14:15:00.000Z",
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
    completed: true,
    kickoffTime: "2027-02-05T15:00:00.000Z",
    actualHomeScore: 21,
    actualAwayScore: 18,
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
  mockMatches[1],
  mockMatches[2],
  mockMatches[0],
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

const mockMatchesWithoutKickoff = [
  {
    id: 301,
    round: 1,
    completed: false,
    kickoffTime: null,
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

function mockSuccessfulMatchesLoad(
  matches = mockMatches
) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => matches,
  } as Response);
}

describe("HomePage", () => {
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

  it("renders the landing page hero immediately", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /Perfect XV/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Analyse\. Predict\./i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Win\./i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Predict every match, test your rugby instincts/i
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Countdown To The Next Fixture")
    ).toBeInTheDocument();
  });

  it("fetches matches on render", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/matches");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows loading state while next fixture is loading", () => {
    vi.mocked(global.fetch).mockReturnValue(
      new Promise(() => {}) as Promise<Response>
    );

    render(<HomePage />);

    expect(
      screen.getByText("Loading next fixture...")
    ).toBeInTheDocument();
  });

  it("renders the earliest upcoming fixture with Irish formatted date and countdown", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Round 1")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/29 Jan 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/14:15/i)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("countdown-timer")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Time until kick-off")
    ).toBeInTheDocument();
  });

  it("sorts unsorted fixtures and still selects the earliest upcoming fixture", async () => {
    mockSuccessfulMatchesLoad(mockUnsortedMatches);

    render(<HomePage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Scotland vs England")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(/29 Jan 2027/i)
    ).toBeInTheDocument();
  });

  it("ignores completed fixtures when selecting next fixture", async () => {
    const matches = [
      mockMatches[2],
      mockMatches[1],
    ];

    mockSuccessfulMatchesLoad(matches);

    render(<HomePage />);

    expect(
      await screen.findByText("Scotland vs England")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Wales vs Italy")
    ).not.toBeInTheDocument();
  });

  it("shows tournament complete state when no upcoming fixtures exist", async () => {
    mockSuccessfulMatchesLoad(mockCompletedOnlyMatches);

    render(<HomePage />);

    expect(
      await screen.findByText("Tournament Complete")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "There are no upcoming fixtures available."
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("countdown-timer")
    ).not.toBeInTheDocument();
  });

  it("shows tournament complete state when fixtures have no kickoff time", async () => {
    mockSuccessfulMatchesLoad(mockMatchesWithoutKickoff);

    render(<HomePage />);

    expect(
      await screen.findByText("Tournament Complete")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "There are no upcoming fixtures available."
      )
    ).toBeInTheDocument();
  });

  it("shows tournament complete state when matches API returns non-ok response", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: "Server error",
      }),
    } as Response);

    render(<HomePage />);

    expect(
      await screen.findByText("Tournament Complete")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "There are no upcoming fixtures available."
      )
    ).toBeInTheDocument();
  });

  it("shows tournament complete state when matches API throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Matches API unavailable")
    );

    render(<HomePage />);

    expect(
      await screen.findByText("Tournament Complete")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "There are no upcoming fixtures available."
      )
    ).toBeInTheDocument();
  });

  it("navigates to register from hero create account button", async () => {
    const user = userEvent.setup();

    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    await user.click(
      screen.getByRole("button", {
        name: "Create Account",
      })
    );

    expect(window.location.href).toBe("/register");
  });

  it("navigates to login from hero login button", async () => {
    const user = userEvent.setup();

    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(window.location.href).toBe("/login");
  });

  it("navigates to predictions from next fixture prediction button", async () => {
    const user = userEvent.setup();

    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Make Your Prediction",
      })
    );

    expect(window.location.href).toBe("/predictions");
  });

  it("renders how it works section", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("How It Works")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1. Register")
    ).toBeInTheDocument();

    expect(
      screen.getByText("2. Predict Scores")
    ).toBeInTheDocument();

    expect(
      screen.getByText("3. Climb the Table")
    ).toBeInTheDocument();
  });

  it("renders competition features section", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("Competition Features")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Live Dashboard")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Predictions")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Leaderboard")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Locked Fixtures")
    ).toBeInTheDocument();
  });

  it("renders scoring overview section", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("Scoring Overview")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Points are awarded based on prediction accuracy/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Predict each fixture score before kick-off/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Exact scores help separate/i)
    ).toBeInTheDocument();
  });

  it("navigates from quick access buttons", async () => {
    const user = userEvent.setup();

    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("Quick Access")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Go To Dashboard",
      })
    );

    expect(window.location.href).toBe("/dashboard");

    window.location.href = "";

    await user.click(
      screen.getByRole("button", {
        name: "Make Predictions",
      })
    );

    expect(window.location.href).toBe("/predictions");

    window.location.href = "";

    await user.click(
      screen.getByRole("button", {
        name: "View Leaderboard",
      })
    );

    expect(window.location.href).toBe("/leaderboard");
  });

  it("renders final call to action section", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText(
        "Ready to prove your rugby knowledge?"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Join Perfect XV, enter your scores/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Register Now",
      })
    ).toBeInTheDocument();
  });

  it("navigates from final CTA register button", async () => {
    const user = userEvent.setup();

    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText(
        "Ready to prove your rugby knowledge?"
      )
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Register Now",
      })
    );

    expect(window.location.href).toBe("/register");
  });

  it("renders footer branding", async () => {
    mockSuccessfulMatchesLoad();

    render(<HomePage />);

    expect(
      await screen.findByText("Predict. Compete. Climb the leaderboard.")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Perfect XV")[0]
    ).toBeInTheDocument();

    expect(
      screen.getByText("Analyse. Predict. Win.")
    ).toBeInTheDocument();
  });
});