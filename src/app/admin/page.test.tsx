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
import AdminPage from "./page";

const mockAdminUser = {
  id: 1,
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  role: "ADMIN",
};

const mockStandardUser = {
  id: 2,
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
    actualHomeScore: null,
    actualAwayScore: null,
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
    completed: true,
    kickoffTime: "2027-01-30T16:45:00.000Z",
    actualHomeScore: 24,
    actualAwayScore: 17,
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
    actualHomeScore: null,
    actualAwayScore: null,
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
  mockMatches[1],
  mockMatches[0],
];

const mockRefreshedMatchesAfterSave = [
  {
    ...mockMatches[0],
    completed: true,
    actualHomeScore: 28,
    actualAwayScore: 20,
  },
  mockMatches[1],
  mockMatches[2],
];

function mockSuccessfulInitialLoad(
  matches = mockMatches
) {
  vi.mocked(global.fetch)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: mockAdminUser,
      }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => matches,
    } as Response);
}

describe("AdminPage", () => {
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

  it("renders loading state before admin data loads", () => {
    vi.mocked(global.fetch).mockReturnValue(
      new Promise(() => {}) as Promise<Response>
    );

    render(<AdminPage />);

    expect(
      screen.getByText("Loading...")
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

    render(<AdminPage />);

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

    render(<AdminPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects non-admin user to dashboard", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: mockStandardUser,
      }),
    } as Response);

    render(<AdminPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when auth API throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Auth API unavailable")
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when admin matches API returns 401", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: mockAdminUser,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => [],
      } as Response);

    render(<AdminPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/matches");
  });

  it("redirects to dashboard when admin matches API returns 403", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: mockAdminUser,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => [],
      } as Response);

    render(<AdminPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/matches");
  });

  it("loads and renders admin results page", async () => {
    mockSuccessfulInitialLoad();

    render(<AdminPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Admin Results Entry",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Fixtures")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Result Entry")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/IRE v FRA/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/SCO v ENG/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/WAL v ITA/i)
    ).toBeInTheDocument();
  });

  it("sorts unsorted fixtures by kickoff time", async () => {
    mockSuccessfulInitialLoad(mockUnsortedMatches);

    render(<AdminPage />);

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

  it("renders Irish formatted kickoff dates", async () => {
    mockSuccessfulInitialLoad();

    render(<AdminPage />);

    expect(
      await screen.findByText(/29 Jan 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/14:15/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/30 Jan 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/16:45/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/05 Feb 2027/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/15:00/i)
    ).toBeInTheDocument();
  });

  it("selects the first fixture by default", async () => {
    mockSuccessfulInitialLoad();

    render(<AdminPage />);

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

  it("selects completed match and loads existing scores", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    render(<AdminPage />);

    expect(
      await screen.findByText(/SCO v ENG/i)
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
      screen.getAllByText("COMPLETE")[0]
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Result: 24 - 17/i)
    ).toBeInTheDocument();
  });

  it("selects another open fixture and clears result fields when no result exists", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    render(<AdminPage />);

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
      screen.getByPlaceholderText("Wales Score")
    ).toHaveValue(null);

    expect(
      screen.getByPlaceholderText("Italy Score")
    ).toHaveValue(null);

    expect(
      screen.getAllByText("OPEN")[0]
    ).toBeInTheDocument();
  });

  it("saves a result successfully", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRefreshedMatchesAfterSave,
      } as Response);

    render(<AdminPage />);

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
        name: "Save Result",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/results",
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
      await screen.findByText("Result saved successfully.")
    ).toBeInTheDocument();

    expect(
      global.fetch
    ).toHaveBeenCalledWith("/api/admin/matches");
  });

  it("shows saving state while result save is processing", async () => {
    const user = userEvent.setup();

    let resolveSave!: (value: Response) => void;

    const savePromise =
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch)
      .mockReturnValueOnce(savePromise)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRefreshedMatchesAfterSave,
      } as Response);

    render(<AdminPage />);

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
        name: "Save Result",
      })
    );

    expect(
      await screen.findByRole("button", {
        name: "Saving Result...",
      })
    ).toBeDisabled();

    resolveSave({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    expect(
      await screen.findByText("Result saved successfully.")
    ).toBeInTheDocument();
  });

  it("shows API error message when save result fails", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: "Invalid score.",
      }),
    } as Response);

    render(<AdminPage />);

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
        name: "Save Result",
      })
    );

    expect(
      await screen.findByText("Invalid score.")
    ).toBeInTheDocument();
  });

  it("shows fallback error message when save result fails without API error text", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<AdminPage />);

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
        name: "Save Result",
      })
    );

    expect(
      await screen.findByText("Failed to save result.")
    ).toBeInTheDocument();
  });

  it("redirects to login when save result returns 401", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<AdminPage />);

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
        name: "Save Result",
      })
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });
  });

  it("redirects to dashboard when save result returns 403", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<AdminPage />);

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
        name: "Save Result",
      })
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });
  });

  it("submits empty score inputs as zero values with current implementation", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatches,
      } as Response);

    render(<AdminPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Save Result",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/results",
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
  });

  it("submits missing home score as zero with current implementation", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatches,
      } as Response);

    render(<AdminPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("France Score"),
      "20"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Result",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/results",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            matchId: 101,
            homeScore: 0,
            awayScore: 20,
          }),
        })
      );
    });
  });

  it("submits missing away score as zero with current implementation", async () => {
    const user = userEvent.setup();

    mockSuccessfulInitialLoad();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatches,
      } as Response);

    render(<AdminPage />);

    expect(
      await screen.findByText("Ireland vs France")
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Ireland Score"),
      "28"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save Result",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/results",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            matchId: 101,
            homeScore: 28,
            awayScore: 0,
          }),
        })
      );
    });
  });
});