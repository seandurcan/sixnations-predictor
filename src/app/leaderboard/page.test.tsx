import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import LeaderboardPage from "./page";

type LeaderboardEntry = {
  id: number;
  rank: number;
  firstName: string | null;
  lastName: string | null;
  totalPoints: number;
  differenceScore: number;
  exactScores: number;
  cumulativeError: number;
  previousRank: number | null;
  rankMovement: number | null;
};

type LeaderboardResponse = {
  page: number;
  pageSize: number;
  totalRecords?: number;
  totalPages?: number;
  data: LeaderboardEntry[];
  success?: boolean;
  error?: string;
};

const fetchMock = vi.fn<typeof fetch>();

const pageOneEntries: LeaderboardEntry[] = [
  {
    id: 3,
    rank: 3,
    firstName: "Charlie",
    lastName: "Clark",
    totalPoints: 95,
    differenceScore: 6,
    exactScores: 2,
    cumulativeError: 25,
    previousRank: 2,
    rankMovement: -1,
  },
  {
    id: 1,
    rank: 1,
    firstName: "Alice",
    lastName: "Anderson",
    totalPoints: 120,
    differenceScore: 10,
    exactScores: 4,
    cumulativeError: 15,
    previousRank: 1,
    rankMovement: 0,
  },
  {
    id: 4,
    rank: 4,
    firstName: "Dave",
    lastName: "Dunne",
    totalPoints: 80,
    differenceScore: 5,
    exactScores: 1,
    cumulativeError: 30,
    previousRank: null,
    rankMovement: null,
  },
  {
    id: 2,
    rank: 2,
    firstName: "Bob",
    lastName: "Brown",
    totalPoints: 110,
    differenceScore: 8,
    exactScores: 3,
    cumulativeError: 20,
    previousRank: 4,
    rankMovement: 2,
  },
];

const pageTwoEntries: LeaderboardEntry[] = [
  {
    id: 5,
    rank: 5,
    firstName: "Eve",
    lastName: "Evans",
    totalPoints: 70,
    differenceScore: 12,
    exactScores: 1,
    cumulativeError: 35,
    previousRank: 5,
    rankMovement: 0,
  },
  {
    id: 6,
    rank: 6,
    firstName: "Frank",
    lastName: "Flynn",
    totalPoints: 65,
    differenceScore: 14,
    exactScores: 0,
    cumulativeError: 40,
    previousRank: 6,
    rankMovement: 0,
  },
];

const defaultResponse: LeaderboardResponse = {
  page: 1,
  pageSize: 10,
  totalRecords: 4,
  totalPages: 1,
  data: pageOneEntries,
};

function createJsonResponse(
  body: unknown,
  status = 200
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function mockLeaderboardResponse(
  response: LeaderboardResponse = defaultResponse
) {
  fetchMock.mockResolvedValueOnce(
    createJsonResponse(response)
  );
}

function getDisplayedPlayerNames() {
  const table = screen.getByRole("table");

  const rows = within(table)
    .getAllByRole("row")
    .slice(1);

  return rows.map((row) => {
    const cells =
      within(row).getAllByRole("cell");

    return cells[2].textContent?.trim();
  });
}

describe("LeaderboardPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the loading state while the request is pending", () => {
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>(() => {
          // Deliberately unresolved.
        })
    );

    render(<LeaderboardPage />);

    expect(
      screen.getByRole("status")
    ).toHaveTextContent(
      "Loading leaderboard..."
    );
  });

  it("loads and renders leaderboard data", async () => {
    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    expect(
      await screen.findByText(
        "Alice Anderson"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Bob Brown")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Charlie Clark")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dave Dunne")
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leaderboard?page=1&pageSize=10",
      expect.objectContaining({
        cache: "no-store",
      })
    );
  });

  it("renders the correct total player count", async () => {
    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      screen.getByText(
        "Total Players: 4"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Showing 4 of 4 players/
      )
    ).toBeInTheDocument();
  });

  it("sorts entries by points by default", async () => {
    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by player name using the dropdown", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /sort by/i,
      }),
      "player"
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by difference score using the dropdown", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /sort by/i,
      }),
      "difference"
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Dave Dunne",
      "Charlie Clark",
      "Bob Brown",
      "Alice Anderson",
    ]);
  });

  it("sorts by exact scores using the dropdown", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /sort by/i,
      }),
      "exact"
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by cumulative error using the dropdown", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /sort by/i,
      }),
      "error"
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by points when the Points heading button is clicked", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /sort by/i,
      }),
      "difference"
    );

    expect(
      getDisplayedPlayerNames()[0]
    ).toBe("Dave Dunne");

    await user.click(
      screen.getByRole("button", {
        name: /points/i,
      })
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by player when the Player heading button is clicked", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.click(
      screen.getByRole("button", {
        name: /player/i,
      })
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by difference when its heading button is clicked", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.click(
      screen.getByRole("button", {
        name: /difference score/i,
      })
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Dave Dunne",
      "Charlie Clark",
      "Bob Brown",
      "Alice Anderson",
    ]);
  });

  it("sorts by exact scores when its heading button is clicked", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.click(
      screen.getByRole("button", {
        name: /exact scores/i,
      })
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("sorts by cumulative error when its heading button is clicked", async () => {
    const user = userEvent.setup();

    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.click(
      screen.getByRole("button", {
        name: /cumulative error/i,
      })
    );

    expect(
      getDisplayedPlayerNames()
    ).toEqual([
      "Alice Anderson",
      "Bob Brown",
      "Charlie Clark",
      "Dave Dunne",
    ]);
  });

  it("renders medals according to the server rank", async () => {
    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      screen.getByText(/🥇\s*1/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/🥈\s*2/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/🥉\s*3/)
    ).toBeInTheDocument();
  });

  it("renders rank movement indicators", async () => {
    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      screen.getByTitle(
        "Rank unchanged"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByTitle(
        "Moved up 2 places"
      )
    ).toHaveTextContent("↑ 2");

    expect(
      screen.getByTitle(
        "Moved down 1 place"
      )
    ).toHaveTextContent("↓ 1");

    expect(
      screen.getByTitle(
        "No previous ranking"
      )
    ).toHaveTextContent("—");
  });

  it("disables the Previous button on the first page", async () => {
    mockLeaderboardResponse({
      ...defaultResponse,
      totalRecords: 12,
      totalPages: 2,
    });

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      screen.getByRole("button", {
        name: "Previous",
      })
    ).toBeDisabled();
  });

  it("disables the Next button on the final page", async () => {
    mockLeaderboardResponse();

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      screen.getByRole("button", {
        name: "Next",
      })
    ).toBeDisabled();
  });

  it("loads the next page when Next is clicked", async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(
      async (input) => {
        const url = String(input);

        if (url.includes("page=2")) {
          return createJsonResponse({
            page: 2,
            pageSize: 10,
            totalRecords: 12,
            totalPages: 2,
            data: pageTwoEntries,
          });
        }

        return createJsonResponse({
          page: 1,
          pageSize: 10,
          totalRecords: 12,
          totalPages: 2,
          data: pageOneEntries,
        });
      }
    );

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Next",
      })
    );

    expect(
      await screen.findByText(
        "Eve Evans"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Frank Flynn")
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leaderboard?page=2&pageSize=10",
      expect.objectContaining({
        cache: "no-store",
      })
    );

    expect(
      screen.getAllByText(
        "Page 2 of 2"
      ).length
    ).toBeGreaterThan(0);
  });

  it("returns to the first page when Previous is clicked", async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(
      async (input) => {
        const url = String(input);

        if (url.includes("page=2")) {
          return createJsonResponse({
            page: 2,
            pageSize: 10,
            totalRecords: 12,
            totalPages: 2,
            data: pageTwoEntries,
          });
        }

        return createJsonResponse({
          page: 1,
          pageSize: 10,
          totalRecords: 12,
          totalPages: 2,
          data: pageOneEntries,
        });
      }
    );

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Next",
      })
    );

    await screen.findByText(
      "Eve Evans"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Previous",
      })
    );

    expect(
      await screen.findByText(
        "Alice Anderson"
      )
    ).toBeInTheDocument();
  });

  it("shows the empty state when no entries exist", async () => {
    mockLeaderboardResponse({
      page: 1,
      pageSize: 10,
      totalRecords: 0,
      totalPages: 1,
      data: [],
    });

    render(<LeaderboardPage />);

    expect(
      await screen.findByText(
        "No leaderboard entries are available."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Total Players: 0"
      )
    ).toBeInTheDocument();
  });

  it("uses the data length when totalRecords is missing", async () => {
    mockLeaderboardResponse({
      page: 1,
      pageSize: 10,
      totalPages: 1,
      data: pageOneEntries,
    });

    render(<LeaderboardPage />);

    await screen.findByText(
      "Alice Anderson"
    );

    expect(
      screen.getByText(
        "Total Players: 4"
      )
    ).toBeInTheDocument();
  });

  it("shows the API error when the request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error:
            "Leaderboard service unavailable.",
        },
        503
      )
    );

    render(<LeaderboardPage />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Leaderboard service unavailable."
    );

    expect(
      screen.queryByRole("table")
    ).not.toBeInTheDocument();
  });

  it("shows a fallback error when the API returns invalid data", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        page: 1,
        totalPages: 1,
        data: null,
      })
    );

    render(<LeaderboardPage />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "The leaderboard returned invalid data."
    );
  });

  it("shows a fallback error when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network failure")
    );

    render(<LeaderboardPage />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Network failure"
    );
  });

  it("renders players with missing names safely", async () => {
    mockLeaderboardResponse({
      page: 1,
      pageSize: 10,
      totalRecords: 1,
      totalPages: 1,
      data: [
        {
          id: 99,
          rank: 1,
          firstName: null,
          lastName: null,
          totalPoints: 10,
          differenceScore: 2,
          exactScores: 0,
          cumulativeError: 5,
          previousRank: null,
          rankMovement: null,
        },
      ],
    });

    render(<LeaderboardPage />);

    expect(
      await screen.findByText(
        "Unknown Player"
      )
    ).toBeInTheDocument();
  });
});
