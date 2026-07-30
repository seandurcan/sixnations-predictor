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
import PredictionsPage from "./page";

const mockUser = {
  id: 1,
  firstName: "Sean",
  lastName: "Durcan",
  email: "sean@example.com",
  role: "USER",
};

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

const mockPastLockedMatches = [
  {
    id: 104,
    round: 1,
    completed: false,
    kickoffTime: "2020-01-29T14:15:00.000Z",
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

const mockEdgeCaseMatches = [
  {
    id: 201,
    round: 1,
    completed: false,
    kickoffTime: "2027-02-10T20:00:00.000Z",
    homeTeam: {
      name: "Ireland",
      shortCode: "IRE",
    },
    awayTeam: {
      name: "Scotland",
      shortCode: "SCO",
    },
  },
  {
    id: 202,
    round: 2,
    completed: false,
    kickoffTime: "2027-02-01T14:00:00.000Z",
    homeTeam: {
      name: "France",
      shortCode: "FRA",
    },
    awayTeam: {
      name: "Italy",
      shortCode: "ITA",
    },
  },
  {
    id: 203,
    round: 3,
    completed: true,
    kickoffTime: "2027-02-15T16:30:00.000Z",
    actualHomeScore: 18,
    actualAwayScore: 18,
    homeTeam: {
      name: "England",
      shortCode: "ENG",
    },
    awayTeam: {
      name: "Wales",
      shortCode: "WAL",
    },
  },
];

const mockPredictions = [
  {
    id: 301,
    matchId: 102,
    predictedHomeScore: 24,
    predictedAwayScore: 17,
    match: mockMatches[1],
  },
];

const mockZeroZeroPrediction = {
  id: 401,
  matchId: 101,
  predictedHomeScore: 0,
  predictedAwayScore: 0,
  match: mockMatches[0],
};

function mockSuccessfulInitialLoad(
  matches = mockMatches,
  predictions = mockPredictions
) {
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
      json: async () => matches,
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => predictions,
    } as Response);
}

describe("PredictionsPage", () => {
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

  it("renders loading state before data loads", async () => {
    vi.mocked(global.fetch).mockReturnValue(
      new Promise(() => {}) as Promise<Response>
    );

    render(<PredictionsPage />);

    expect(
      screen.getByText("Loading predictions...")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated user to login when auth request is not ok", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        authenticated: false,
      }),
    } as Response);

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects unauthenticated user to login when authenticated is false", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: false,
      }),
    } as Response);

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when auth API request throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when matches API request fails", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: mockUser,
        }),
      } as Response)
      .mockRejectedValueOnce(
        new Error("Matches API unavailable")
      );

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledWith("/api/matches");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("redirects to login when predictions API request fails during initial load", async () => {
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
        json: async () => mockMatches,
      } as Response)
      .mockRejectedValueOnce(
        new Error("Predictions API unavailable")
      );

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledWith("/api/matches");
    expect(global.fetch).toHaveBeenCalledWith("/api/predictions/list");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("sorts unsorted fixture data by kickoff time and selects earliest open fixture", async () => {
    mockSuccessfulInitialLoad(
      mockUnsortedMatches,
      []
    );

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Ireland Score")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("France Score")
    ).toBeInTheDocument();
  });

  it("uses edge-case fixture mock data and selects the earliest open fixture", async () => {
    mockSuccessfulInitialLoad(
      mockEdgeCaseMatches,
      []
    );

    render(<PredictionsPage />);

    expect(
      await screen.findByText("France vs Italy")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("France Score")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Italy Score")
    ).toBeInTheDocument();

    expect(
  screen.getAllByText(/01 Feb 2027/i)[0]
).toBeInTheDocument();
  });

  it("renders predictions page with fixture, progress, and Irish formatted kick-off date", async () => {
    mockSuccessfulInitialLoad();

    render(<PredictionsPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Predictions",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Welcome Sean")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 / 3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
  screen.getAllByText(/29 Jan 2027/i)[0]
).toBeInTheDocument();

    expect(
  screen.getAllByText(/14:15/i)[0]
).toBeInTheDocument();
  });

  it("shows saved predictions with formatted fixture date", async () => {
    mockSuccessfulInitialLoad();

    render(<PredictionsPage />);

    expect(
      await screen.findByText("SCO 24 - 17 ENG")
    ).toBeInTheDocument();

    expect(
  screen.getAllByText(/30 Jan 2027/i)[0]
).toBeInTheDocument();

    expect(
  screen.getAllByText(/16:45/i)[0]
).toBeInTheDocument();

  });

  it("shows empty predictions state", async () => {
    mockSuccessfulInitialLoad(mockMatches, []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("0 / 3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("You have not saved any predictions yet.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Ireland vs France")
    ).toBeInTheDocument();
  });

  it("shows partial predictions progress when only some matches have predictions", async () => {
    const partialPredictions = [
      {
        id: 501,
        matchId: 101,
        predictedHomeScore: 28,
        predictedAwayScore: 20,
        match: mockMatches[0],
      },
    ];

    mockSuccessfulInitialLoad(mockMatches, partialPredictions);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 / 3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("IRE 28 - 20 FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Scotland vs England")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Scotland Score")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("England Score")
    ).toBeInTheDocument();
  });

  it("selects the first unpredicted open fixture automatically", async () => {
    const partialPredictions = [
      {
        id: 601,
        matchId: 101,
        predictedHomeScore: 28,
        predictedAwayScore: 20,
        match: mockMatches[0],
      },
    ];

    mockSuccessfulInitialLoad(mockMatches, partialPredictions);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Scotland vs England")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Scotland Score")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("England Score")
    ).toBeInTheDocument();
  });

  it("shows full predictions progress when all matches have predictions", async () => {
    const fullPredictions = [
      {
        id: 701,
        matchId: 101,
        predictedHomeScore: 28,
        predictedAwayScore: 20,
        match: mockMatches[0],
      },
      {
        id: 702,
        matchId: 102,
        predictedHomeScore: 24,
        predictedAwayScore: 17,
        match: mockMatches[1],
      },
      {
        id: 703,
        matchId: 103,
        predictedHomeScore: 19,
        predictedAwayScore: 14,
        match: mockMatches[2],
      },
    ];

    mockSuccessfulInitialLoad(mockMatches, fullPredictions);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("3 / 3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("IRE 28 - 20 FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("SCO 24 - 17 ENG")
    ).toBeInTheDocument();

    expect(
      screen.getByText("WAL 19 - 14 ITA")
    ).toBeInTheDocument();
  });

  it("shows COMPLETE status for completed fixtures", async () => {
    mockSuccessfulInitialLoad();

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
      screen.getByText("COMPLETE")
    ).toBeInTheDocument();
  });

  it("treats an incomplete fixture as locked when kick-off time is in the past", async () => {
    mockSuccessfulInitialLoad(
      mockPastLockedMatches,
      []
    );

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
  screen.getAllByText("LOCKED")[0]
).toBeInTheDocument();

    expect(
      screen.queryByText("Time until predictions lock")
    ).not.toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Ireland Score")
    ).toBeDisabled();

    expect(
      screen.getByPlaceholderText("France Score")
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    ).toBeDisabled();
  });

  it("shows countdown for open fixtures", async () => {
    mockSuccessfulInitialLoad(mockMatches, []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Time until predictions lock")
    ).toBeInTheDocument();
  });

  it("hides countdown and disables inputs when completed fixture is selected", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /WAL v ITA/i,
      })
    );

    expect(
      screen.getByText("Wales vs Italy")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Time until predictions lock")
    ).not.toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Wales Score")
    ).toBeDisabled();

    expect(
      screen.getByPlaceholderText("Italy Score")
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    ).toBeDisabled();
  });

  it("shows existing prediction card when locked fixture has a prediction", async () => {
    const user = userEvent.setup();

    const predictions = [
      {
        id: 801,
        matchId: 103,
        predictedHomeScore: 19,
        predictedAwayScore: 14,
        match: mockMatches[2],
      },
    ];

    mockSuccessfulInitialLoad(mockMatches, predictions);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /WAL v ITA/i,
      })
    );

    expect(
      screen.getByText("Your Existing Prediction")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("19 - 14")[0]
    ).toBeInTheDocument();
  });

  it("allows selecting another fixture from the fixture list", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /SCO v ENG/i,
      })
    );

    expect(
      screen.getByText("Scotland vs England")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("24")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("17")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Editing Prediction")
    ).toBeInTheDocument();
  });

  it("clears score inputs when switching from editing prediction to unpredicted fixture", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /SCO v ENG/i,
      })
    );

    expect(
      screen.getByDisplayValue("24")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("17")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /IRE v FRA/i,
      })
    );

    expect(
      screen.getByPlaceholderText("Ireland Score")
    ).toHaveValue(null);

    expect(
      screen.getByPlaceholderText("France Score")
    ).toHaveValue(null);

    expect(
      screen.queryByText("Editing Prediction")
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    ).toBeInTheDocument();
  });

  it("updates an existing prediction successfully", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 301,
            matchId: 102,
            predictedHomeScore: 30,
            predictedAwayScore: 21,
            match: mockMatches[1],
          },
        ],
      } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /SCO v ENG/i,
      })
    );

    const homeInput =
      screen.getByPlaceholderText("Scotland Score");

    const awayInput =
      screen.getByPlaceholderText("England Score");

    await user.clear(homeInput);
    await user.type(homeInput, "30");

    await user.clear(awayInput);
    await user.type(awayInput, "21");

    await user.click(
      screen.getByRole("button", {
        name: "Update Prediction",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/predictions",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            matchId: 102,
            homeScore: 30,
            awayScore: 21,
          }),
        })
      );
    });

    expect(
      await screen.findByText("Prediction updated successfully.")
    ).toBeInTheDocument();
  });

  it("allows user interaction by selecting a fixture, entering scores, and saving", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 901,
            matchId: 102,
            predictedHomeScore: 18,
            predictedAwayScore: 25,
            match: mockMatches[1],
          },
        ],
      } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /SCO v ENG/i,
      })
    );

    expect(
      screen.getByText("Scotland vs England")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Scotland Score"),
      "18"
    );

    await user.type(
      screen.getByPlaceholderText("England Score"),
      "25"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/predictions",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            matchId: 102,
            homeScore: 18,
            awayScore: 25,
          }),
        })
      );
    });

    expect(
      await screen.findByText("Prediction saved successfully.")
    ).toBeInTheDocument();
  });

  it("allows zero-zero score prediction", async () => {
    /*
      This test intentionally verifies that string value "0" is accepted.
      Empty inputs should be rejected, but "0" is a real numeric value.
      This protects against future validation mistakes such as:
      if (!homeScore || !awayScore)
      which can incorrectly reject valid zero values in score forms.
    */

    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          mockZeroZeroPrediction,
        ],
      } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "0"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "0"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/predictions",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            matchId: 101,
            homeScore: 0,
            awayScore: 0,
          }),
        })
      );
    });

    expect(
      await screen.findByText("Prediction saved successfully.")
    ).toBeInTheDocument();

    expect(
      await screen.findByText("IRE 0 - 0 FRA")
    ).toBeInTheDocument();
  });

  it("shows saving state while save request is processing", async () => {
    const user = userEvent.setup();

    let resolveSave!: (value: Response) => void;

    const savePromise =
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch)
      .mockReturnValueOnce(savePromise)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1001,
            matchId: 101,
            predictedHomeScore: 24,
            predictedAwayScore: 18,
            match: mockMatches[0],
          },
        ],
      } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "24"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "18"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByRole("button", {
        name: "Saving...",
      })
    ).toBeDisabled();

    resolveSave({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as Response);

    expect(
      await screen.findByText("Prediction saved successfully.")
    ).toBeInTheDocument();
  });

  it("saves a new prediction successfully", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1101,
            matchId: 101,
            predictedHomeScore: 28,
            predictedAwayScore: 20,
            match: mockMatches[0],
          },
        ],
      } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "28"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "20"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/predictions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchId: 101,
            homeScore: 28,
            awayScore: 20,
          }),
        })
      );
    });

    expect(
      await screen.findByText("Prediction saved successfully.")
    ).toBeInTheDocument();
  });

  it("refreshes prediction data after saving a prediction", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    const refreshedPredictions = [
      {
        id: 1201,
        matchId: 101,
        predictedHomeScore: 31,
        predictedAwayScore: 19,
        match: mockMatches[0],
      },
    ];

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => refreshedPredictions,
      } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "31"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "19"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/predictions/list"
      );
    });

    expect(
      await screen.findByText("IRE 31 - 19 FRA")
    ).toBeInTheDocument();
  });

  it("shows validation error when both score inputs are empty", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText(
        "Enter both scores before saving your prediction."
      )
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("shows validation error when home score is empty", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "20"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText(
        "Enter both scores before saving your prediction."
      )
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("shows validation error when away score is empty", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "24"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText(
        "Enter both scores before saving your prediction."
      )
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("shows API error message when saving prediction fails with non-403 response", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: "Invalid prediction score.",
      }),
    } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "20"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "18"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText("Invalid prediction score.")
    ).toBeInTheDocument();
  });

  it("shows fallback API error message when save fails without error text", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "20"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "18"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText("Failed to save prediction.")
    ).toBeInTheDocument();
  });

  it("shows network error message when save API throws", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Save API unavailable")
    );

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "20"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "18"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText(
        "Unable to save prediction. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("handles refresh predictions API failure after successful save attempt", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockRejectedValueOnce(
        new Error("Refresh predictions failed")
      );

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "24"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "18"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/predictions/list"
      );
    });

    expect(
      await screen.findByText(
        "Unable to save prediction. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("shows locked fixture error when API returns 403", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad(mockMatches, []);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: "Fixture locked.",
      }),
    } as Response);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "20"
    );

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "18"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Prediction",
      })
    );

    expect(
      await screen.findByText(
        "This fixture has already kicked off. Predictions can no longer be edited."
      )
    ).toBeInTheDocument();
  });

  it("shows no matches available when no fixtures exist", async () => {
    mockSuccessfulInitialLoad([], []);

    render(<PredictionsPage />);

    expect(
      await screen.findByText("No matches available.")
    ).toBeInTheDocument();
  });
});