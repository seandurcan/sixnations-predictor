import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DuplicateAccountsPage from "./page";

const candidate = {
  lowerUser: {
    id: 2, firstName: "Caroline", lastName: "Lister", email: "one@example.com", mobile: "0868294141",
    role: "USER", emailVerified: true, createdAt: "2026-01-01T00:00:00.000Z", competitionEntries: [],
    _count: { predictions: 15, payments: 1, submissions: 1, competitionEntries: 1 },
  },
  higherUser: {
    id: 5, firstName: "Caroline", lastName: "Litster", email: "two@example.com", mobile: "0868294141",
    role: "USER", emailVerified: true, createdAt: "2026-02-01T00:00:00.000Z", competitionEntries: [],
    _count: { predictions: 0, payments: 0, submissions: 0, competitionEntries: 0 },
  },
  reasons: ["MOBILE", "SIMILAR_NAME"],
  decision: "UNREVIEWED",
  reviewedAt: null,
  reviewedById: null,
};
const loaded = {
  success: true,
  candidates: [candidate],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  totals: { all: 1, unreviewed: 1, samePerson: 0, notDuplicate: 0 },
};

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("Duplicate Account Review page", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValueOnce(response(loaded));
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  it("shows both accounts, evidence and the controlled-merge safeguard", async () => {
    render(<DuplicateAccountsPage />);
    expect(await screen.findByText("Caroline Lister")).toBeInTheDocument();
    expect(screen.getByText("Caroline Litster")).toBeInTheDocument();
    expect(screen.getByText("Same mobile")).toBeInTheDocument();
    expect(screen.getByText(/requires a preview, a surviving account, a conflict rule and typed email confirmation/i)).toBeInTheDocument();
  });

  it("requires explicit confirmation before saving a classification", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(response({ success: true, message: "Saved" }))
      .mockResolvedValueOnce(response({ ...loaded, candidates: [], pagination: { ...loaded.pagination, total: 0 } }));
    render(<DuplicateAccountsPage />);
    await screen.findByText("Caroline Lister");
    await user.click(screen.getByRole("button", { name: "Mark as Same Person" }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Confirm Decision" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
    expect(vi.mocked(global.fetch).mock.calls[1][1]).toMatchObject({ method: "POST" });
  });
});
