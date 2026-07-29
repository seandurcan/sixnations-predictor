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
import AuditPage from "./page";

const mockAuditsPageOne = [
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
    adminUser: {
      firstName: "Result",
      lastName: "Manager",
    },
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
];

const mockAuditsPageTwo = [
  {
    id: 401,
    matchId: 103,
    previousHome: 10,
    previousAway: 8,
    newHome: 12,
    newAway: 11,
    createdAt: "2027-02-01T12:00:00.000Z",
    adminUserId: 3,
    adminUser: {
      firstName: "Second",
      lastName: "Admin",
    },
    match: {
      id: 103,
      homeTeam: {
        shortCode: "WAL",
      },
      awayTeam: {
        shortCode: "ITA",
      },
    },
  },
];

const mockAuditWithoutMatch = [
  {
    id: 501,
    matchId: 999,
    previousHome: 20,
    previousAway: 18,
    newHome: 21,
    newAway: 19,
    createdAt: "2027-02-05T10:45:00.000Z",
    adminUserId: 9,
    adminUser: {
      firstName: "Fallback",
      lastName: "Admin",
    },
    match: null,
  },
];

const mockAuditWithoutAdminUser = [
  {
    id: 601,
    matchId: 104,
    previousHome: 5,
    previousAway: 3,
    newHome: 8,
    newAway: 6,
    createdAt: "2027-02-06T09:15:00.000Z",
    adminUserId: 44,
    adminUser: null,
    match: {
      id: 104,
      homeTeam: {
        shortCode: "ENG",
      },
      awayTeam: {
        shortCode: "IRE",
      },
    },
  },
];

function mockSuccessfulAuditLoad({
  audits = mockAuditsPageOne,
  totalPages = 2,
}: {
  audits?: any[];
  totalPages?: number;
} = {}) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      audits,
      totalPages,
    }),
  } as Response);
}

describe("AuditPage", () => {
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

  it("renders loading state before audit data loads", () => {
    vi.mocked(global.fetch).mockReturnValue(
      new Promise(() => {}) as Promise<Response>
    );

    render(<AuditPage />);

    expect(
      screen.getByText("Loading audit records...")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Loading audit history...")
    ).toBeInTheDocument();
  });

  it("fetches audit history on render", async () => {
    mockSuccessfulAuditLoad();

    render(<AuditPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Audit History",
      })
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/audit?page=1&pageSize=10"
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when audit API returns 401", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        audits: [],
        totalPages: 1,
      }),
    } as Response);

    render(<AuditPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/audit?page=1&pageSize=10"
    );
  });

  it("redirects to dashboard when audit API returns 403", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        audits: [],
        totalPages: 1,
      }),
    } as Response);

    render(<AuditPage />);

    await waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/audit?page=1&pageSize=10"
    );
  });

  it("renders audit table with headings", async () => {
    mockSuccessfulAuditLoad();

    render(<AuditPage />);

    expect(
      await screen.findByText("Date")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Match")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Previous Score")
    ).toBeInTheDocument();

    expect(
      screen.getByText("New Score")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Admin")
    ).toBeInTheDocument();
  });

  it("renders audit rows with match names and score changes", async () => {
    mockSuccessfulAuditLoad();

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("SCO v ENG")
    ).toBeInTheDocument();

    expect(
      screen.getByText("- - -")
    ).toBeInTheDocument();

    expect(
      screen.getByText("28 - 20")
    ).toBeInTheDocument();

    expect(
      screen.getByText("17 - 14")
    ).toBeInTheDocument();

    expect(
      screen.getByText("24 - 17")
    ).toBeInTheDocument();
  });

  it("renders admin user names", async () => {
    mockSuccessfulAuditLoad();

    render(<AuditPage />);

    expect(
      await screen.findByText("Admin User")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Result Manager")
    ).toBeInTheDocument();
  });

  it("renders Irish formatted audit dates", async () => {
    mockSuccessfulAuditLoad();

    render(<AuditPage />);

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

  it("renders empty audit state", async () => {
    mockSuccessfulAuditLoad({
      audits: [],
      totalPages: 1,
    });

    render(<AuditPage />);

    expect(
      await screen.findByText("No audit records found.")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Date")
    ).not.toBeInTheDocument();
  });

  it("renders fallback match label when match relationship is missing", async () => {
    mockSuccessfulAuditLoad({
      audits: mockAuditWithoutMatch,
      totalPages: 1,
    });

    render(<AuditPage />);

    expect(
      await screen.findByText("Match 999")
    ).toBeInTheDocument();

    expect(
      screen.getByText("20 - 18")
    ).toBeInTheDocument();

    expect(
      screen.getByText("21 - 19")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Fallback Admin")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/05 Feb 2027/i)
    ).toBeInTheDocument();
  });

  it("renders fallback admin id when admin user relationship is missing", async () => {
    mockSuccessfulAuditLoad({
      audits: mockAuditWithoutAdminUser,
      totalPages: 1,
    });

    render(<AuditPage />);

    expect(
      await screen.findByText("ENG v IRE")
    ).toBeInTheDocument();

    expect(
      screen.getByText("44")
    ).toBeInTheDocument();

    expect(
      screen.getByText("5 - 3")
    ).toBeInTheDocument();

    expect(
      screen.getByText("8 - 6")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/06 Feb 2027/i)
    ).toBeInTheDocument();
  });

  it("shows pagination controls when audit rows exist", async () => {
    mockSuccessfulAuditLoad({
      audits: mockAuditsPageOne,
      totalPages: 2,
    });

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Previous",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Next",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Page 1 of 2")
    ).toBeInTheDocument();
  });

  it("disables previous button on first page", async () => {
    mockSuccessfulAuditLoad({
      audits: mockAuditsPageOne,
      totalPages: 2,
    });

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Previous",
      })
    ).toBeDisabled();
  });

  it("disables next button on final page", async () => {
    mockSuccessfulAuditLoad({
      audits: mockAuditsPageOne,
      totalPages: 1,
    });

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Next",
      })
    ).toBeDisabled();

    expect(
      screen.getByText("Page 1 of 1")
    ).toBeInTheDocument();
  });

  it("loads next page of audit results", async () => {
    const user = userEvent.setup();

    mockSuccessfulAuditLoad({
      audits: mockAuditsPageOne,
      totalPages: 2,
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        audits: mockAuditsPageTwo,
        totalPages: 2,
      }),
    } as Response);

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Next",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/audit?page=2&pageSize=10"
      );
    });

    expect(
      await screen.findByText("WAL v ITA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("12 - 11")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Page 2 of 2")
    ).toBeInTheDocument();
  });

  it("returns to previous page of audit results", async () => {
    const user = userEvent.setup();

    mockSuccessfulAuditLoad({
      audits: mockAuditsPageOne,
      totalPages: 2,
    });

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          audits: mockAuditsPageTwo,
          totalPages: 2,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          audits: mockAuditsPageOne,
          totalPages: 2,
        }),
      } as Response);

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Next",
      })
    );

    expect(
      await screen.findByText("WAL v ITA")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Previous",
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/audit?page=1&pageSize=10"
      );
    });

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Page 1 of 2")
    ).toBeInTheDocument();
  });

  it("handles audit API throwing by ending loading state", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Audit API unavailable")
    );

    render(<AuditPage />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading audit history...")
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByText("No audit records found.")
    ).toBeInTheDocument();
  });

  it("falls back to one page when totalPages is missing", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        audits: mockAuditsPageOne,
      }),
    } as Response);

    render(<AuditPage />);

    expect(
      await screen.findByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Page 1 of 1")
    ).toBeInTheDocument();
  });

  it("falls back to empty audit array when audits is missing", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        totalPages: 1,
      }),
    } as Response);

    render(<AuditPage />);

    expect(
      await screen.findByText("No audit records found.")
    ).toBeInTheDocument();
  });
});