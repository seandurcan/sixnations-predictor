import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  session: { deleteMany: vi.fn() },
  passwordReset: { deleteMany: vi.fn() },
  emailVerification: { deleteMany: vi.fn() },
  emailPreferenceToken: { deleteMany: vi.fn() },
  announcementDelivery: { updateMany: vi.fn() },
  user: { update: vi.fn() },
  adminUserActionAudit: { create: vi.fn() },
};

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { DELETE } from "./route";

function request(confirmationEmail: string) {
  return new Request("http://localhost/api/admin/users/9", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationEmail }),
  });
}

const context = { params: Promise.resolve({ userId: "9" }) };

describe("DELETE /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      authorized: true,
      user: { id: 42, role: "ADMIN" },
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 9,
      email: "person@example.com",
      role: "USER",
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return await callback(tx as never);
    });
  });

  it("requires administrator access", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as never);

    const response = (await DELETE(request("person@example.com") as never, context))!;

    expect(response.status).toBe(401);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("protects administrator accounts", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 9,
      email: "admin@example.com",
      role: "ADMIN",
    } as never);

    const response = (await DELETE(request("admin@example.com") as never, context))!;

    expect(response.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("requires the exact account email as confirmation", async () => {
    const response = (await DELETE(request("wrong@example.com") as never, context))!;

    expect(response.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("anonymises the account, revokes access and retains competition records", async () => {
    const response = (await DELETE(request("PERSON@example.com") as never, context))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("competition history was anonymised");
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.passwordReset.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.emailVerification.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.emailPreferenceToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.announcementDelivery.updateMany).toHaveBeenCalledWith({
      where: { recipientUserId: 9 },
      data: expect.objectContaining({ recipientUserId: null, unsubscribeToken: null }),
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: expect.objectContaining({
        firstName: "Former",
        lastName: "Participant",
        mobile: "",
        emailVerified: false,
        deletedAt: expect.any(Date),
      }),
    });
    expect(tx.adminUserActionAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 42,
        targetUserId: 9,
        action: "DELETE_ACCOUNT",
        status: "SUCCEEDED",
      }),
    });
  });
});
