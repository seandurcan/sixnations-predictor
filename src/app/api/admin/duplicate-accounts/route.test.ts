import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  duplicateAccountReview: { upsert: vi.fn() },
  adminUserActionAudit: { create: vi.fn() },
};

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    duplicateAccountReview: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

const baseAccount = {
  role: "USER",
  emailVerified: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  competitionEntries: [],
  _count: { predictions: 0, payments: 0, submissions: 0, competitionEntries: 0 },
};
const users = [
  { ...baseAccount, id: 2, firstName: "Caroline", lastName: "Lister", email: "one@example.com", mobile: "0868294141" },
  { ...baseAccount, id: 5, firstName: "Caroline", lastName: "Litster", email: "two@example.com", mobile: "0868294141" },
  { ...baseAccount, id: 8, firstName: "John", lastName: "Ryan", email: "john@example.com", mobile: "" },
];

function postRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/duplicate-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin duplicate account review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ authorized: true, user: { id: 1, role: "ADMIN" } } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue(users as never);
    vi.mocked(prisma.duplicateAccountReview.findMany).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as never));
  });

  it("requires administrator access", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as never);
    expect((await GET(new Request("http://localhost/api/admin/duplicate-accounts") as never))!.status).toBe(401);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("returns only matching pairs with account history and reasons", async () => {
    const response = (await GET(new Request("http://localhost/api/admin/duplicate-accounts?decision=UNREVIEWED") as never))!;
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.candidates).toHaveLength(1);
    expect(body.candidates[0]).toMatchObject({
      lowerUser: { id: 2 },
      higherUser: { id: 5 },
      reasons: expect.arrayContaining(["MOBILE", "SIMILAR_NAME"]),
      decision: "UNREVIEWED",
    });
    expect(body.totals).toEqual({ all: 1, unreviewed: 1, samePerson: 0, notDuplicate: 0 });
  });

  it("applies stored review classifications", async () => {
    vi.mocked(prisma.duplicateAccountReview.findMany).mockResolvedValueOnce([{
      id: 10,
      lowerUserId: 2,
      higherUserId: 5,
      decision: "SAME_PERSON",
      reviewedById: 1,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }] as never);
    const response = (await GET(new Request("http://localhost/api/admin/duplicate-accounts?decision=SAME_PERSON") as never))!;
    const body = await response.json();
    expect(body.candidates).toHaveLength(1);
    expect(body.candidates[0].decision).toBe("SAME_PERSON");
  });

  it("records a classification and audit without changing either user", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce(users.slice(0, 2) as never);
    const response = (await POST(postRequest({ firstUserId: 5, secondUserId: 2, decision: "NOT_DUPLICATE" }) as never))!;
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.message).toContain("No account data was changed");
    expect(tx.duplicateAccountReview.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { lowerUserId_higherUserId: { lowerUserId: 2, higherUserId: 5 } },
      create: expect.objectContaining({ decision: "NOT_DUPLICATE", reviewedById: 1 }),
    }));
    expect(tx.adminUserActionAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetUserId: 2,
        action: "DUPLICATE_REVIEW",
        status: "SUCCEEDED",
        detail: expect.stringContaining("No account data changed"),
      }),
    });
    expect(tx).not.toHaveProperty("user");
  });

  it("refuses to classify accounts that no longer match", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { id: 2, firstName: "Caroline", lastName: "Lister", email: "one@example.com", mobile: "0868294141" },
      { id: 8, firstName: "John", lastName: "Ryan", email: "john@example.com", mobile: "" },
    ] as never);
    const response = (await POST(postRequest({ firstUserId: 2, secondUserId: 8, decision: "SAME_PERSON" }) as never))!;
    expect(response.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
