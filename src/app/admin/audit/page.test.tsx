import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuditPage from "./page";

const responseBody = {
  success: true,
  records: [
    {
      id: "account-4",
      category: "ACCOUNT",
      action: "DELETE_ACCOUNT",
      status: "SUCCEEDED",
      createdAt: "2026-09-22T10:00:00.000Z",
      admin: { id: 1, name: "Admin User" },
      target: { id: 9, label: "Former Participant (account 9)" },
      detail: "Identity anonymised; anonymous competition history retained.",
    },
    {
      id: "result-3",
      category: "RESULT",
      action: "RESULT_CHANGED",
      status: "SUCCEEDED",
      createdAt: "2026-09-21T10:00:00.000Z",
      admin: { id: 1, name: "Admin User" },
      target: { id: 8, label: "IRE v FRA", previous: "10 - 12", current: "20 - 19" },
      detail: "Match result changed.",
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 2, totalPages: 2 },
  totals: { resultChanges: 1, accountActions: 1 },
};

function mockSuccess(body = responseBody) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);
}

describe("AuditPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    global.fetch = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  it("loads and displays result and account-support audit records", async () => {
    mockSuccess();

    render(<AuditPage />);

    expect((await screen.findAllByText("Former Participant (account 9)")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Account deleted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IRE v FRA").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10 - 12/).length).toBeGreaterThan(0);
    expect(screen.getByText("Matching Records")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/audit?"),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("applies selected filters and starts again at page one", async () => {
    const user = userEvent.setup();
    mockSuccess();
    mockSuccess({ ...responseBody, records: [responseBody.records[0]] });
    render(<AuditPage />);
    await screen.findAllByText("Former Participant (account 9)");

    await user.selectOptions(screen.getByLabelText("Category"), "ACCOUNT");
    await user.selectOptions(screen.getByLabelText("Action"), "DELETE_ACCOUNT");
    await user.click(screen.getByRole("button", { name: "Apply Filters" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const secondUrl = vi.mocked(global.fetch).mock.calls[1][0] as string;
    expect(secondUrl).toContain("category=ACCOUNT");
    expect(secondUrl).toContain("action=DELETE_ACCOUNT");
    expect(secondUrl).toContain("page=1");
  });

  it("uses the applied filters when moving to the next page", async () => {
    const user = userEvent.setup();
    mockSuccess();
    mockSuccess({ ...responseBody, pagination: { ...responseBody.pagination, page: 2 } });
    render(<AuditPage />);
    await screen.findAllByText("Former Participant (account 9)");

    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(vi.mocked(global.fetch).mock.calls[1][0]).toContain("page=2");
  });

  it("redirects unauthenticated users to login", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: "Unauthorized" }),
    } as Response);

    render(<AuditPage />);

    await waitFor(() => expect(window.location.href).toBe("/login"));
  });

  it("shows an empty filtered state", async () => {
    mockSuccess({
      ...responseBody,
      records: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      totals: { resultChanges: 0, accountActions: 0 },
    });

    render(<AuditPage />);

    expect(await screen.findByText("No audit records match the selected filters.")).toBeInTheDocument();
  });
});
