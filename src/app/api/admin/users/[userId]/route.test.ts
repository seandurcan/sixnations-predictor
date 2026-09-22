import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  session: { deleteMany: vi.fn() },
  passwordReset: { deleteMany: vi.fn() },
  emailVerification: { deleteMany: vi.fn(), create: vi.fn() },
  emailPreferenceToken: { deleteMany: vi.fn() },
  announcementDelivery: { updateMany: vi.fn() },
  user: { update: vi.fn() },
  adminUserActionAudit: { create: vi.fn() },
};

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmailVerificationEmail: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    emailVerification: { delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendEmailVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { DELETE, PATCH } from "./route";

function request(confirmationEmail: string) {
  return new Request("http://localhost/api/admin/users/9", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationEmail }),
  });
}

const context = { params: Promise.resolve({ userId: "9" }) };

function patchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/users/9", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const existingUser = {
  id: 9,
  firstName: "Old",
  lastName: "Name",
  email: "person@example.com",
  mobile: "0870000000",
};

const correctedDetails = {
  firstName: "New",
  lastName: "Name",
  email: "person@example.com",
  mobile: "0870000000",
};

describe("PATCH /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      authorized: true,
      user: { id: 42, role: "ADMIN" },
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(existingUser as never);
    vi.mocked(prisma.emailVerification.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return await callback(tx as never);
    });
    vi.mocked(sendEmailVerificationEmail).mockResolvedValue({} as never);
  });

  it("validates required account details before loading the account", async () => {
    const response = (await PATCH(patchRequest({ ...correctedDetails, firstName: "" }) as never, context))!;

    expect(response.status).toBe(400);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a correction when no details changed", async () => {
    const response = (await PATCH(patchRequest({ ...existingUser }) as never, context))!;

    expect(response.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("corrects profile fields without changing security state or competition records", async () => {
    const response = (await PATCH(patchRequest(correctedDetails) as never, context))!;

    expect(response.status).toBe(200);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        firstName: "New",
        lastName: "Name",
        email: "person@example.com",
        mobile: "0870000000",
      },
    });
    expect(tx.passwordReset.deleteMany).not.toHaveBeenCalled();
    expect(tx.emailVerification.deleteMany).not.toHaveBeenCalled();
    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
    expect(tx.adminUserActionAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 42,
        targetUserId: 9,
        action: "CORRECT_ACCOUNT",
        status: "SUCCEEDED",
        detail: "Corrected fields: first name.",
      }),
    });
  });

  it("requires current-email confirmation before changing an email address", async () => {
    const response = (await PATCH(patchRequest({
      ...existingUser,
      email: "new@example.com",
      confirmationEmail: "wrong@example.com",
    }) as never, context))!;

    expect(response.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("prevents duplicate email addresses", async () => {
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce(existingUser as never)
      .mockResolvedValueOnce({ id: 10 } as never);

    const response = (await PATCH(patchRequest({
      ...existingUser,
      email: "used@example.com",
      confirmationEmail: "person@example.com",
    }) as never, context))!;

    expect(response.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("invalidates existing links and sends fresh verification after an email correction", async () => {
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce(existingUser as never)
      .mockResolvedValueOnce(null);

    const response = (await PATCH(patchRequest({
      ...existingUser,
      email: "NEW@example.com",
      confirmationEmail: "PERSON@example.com",
    }) as never, context))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("verification email was sent");
    expect(tx.passwordReset.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.emailVerification.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.emailPreferenceToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: expect.objectContaining({
        email: "new@example.com",
        emailVerified: false,
        lastVerificationReminderAt: null,
      }),
    });
    expect(tx.emailVerification.create).toHaveBeenCalledWith({
      data: { userId: 9, token: expect.any(String), expiresAt: expect.any(Date) },
    });
    expect(sendEmailVerificationEmail).toHaveBeenCalledWith("new@example.com", expect.any(String));
  });

  it("keeps the saved correction and returns a warning if verification delivery fails", async () => {
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce(existingUser as never)
      .mockResolvedValueOnce(null);
    vi.mocked(sendEmailVerificationEmail).mockRejectedValueOnce(new Error("Provider unavailable"));

    const response = (await PATCH(patchRequest({
      ...existingUser,
      email: "new@example.com",
      confirmationEmail: "person@example.com",
    }) as never, context))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.warning).toContain("Resend Verification");
    expect(tx.user.update).toHaveBeenCalled();
    expect(prisma.emailVerification.delete).toHaveBeenCalledWith({ where: { token: expect.any(String) } });
  });
});

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
