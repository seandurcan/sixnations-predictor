import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendEmailVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    emailVerification: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
    passwordReset: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
    adminUserActionAudit: { create: vi.fn() },
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

function request(action: string) {
  return new Request("http://localhost/api/admin/users/9/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

const context = { params: Promise.resolve({ userId: "9" }) };

describe("POST /api/admin/users/[userId]/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      authorized: true,
      user: { id: 42, role: "ADMIN" },
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 9,
      email: "person@example.com",
      emailVerified: false,
    } as never);
    vi.mocked(prisma.emailVerification.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.passwordReset.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.emailVerification.delete).mockResolvedValue({ id: 1 } as never);
    vi.mocked(prisma.passwordReset.delete).mockResolvedValue({ id: 1 } as never);
    vi.mocked(prisma.adminUserActionAudit.create).mockResolvedValue({ id: 1 } as never);
    vi.mocked(sendEmailVerificationEmail).mockResolvedValue({ id: "verification-message" } as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue({ id: "reset-message" } as never);
  });

  it("requires administrator access", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as never);

    const response = (await POST(request("SEND_PASSWORD_RESET") as never, context))!;

    expect(response.status).toBe(401);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("sends and audits a verification email", async () => {
    const response = (await POST(request("RESEND_VERIFICATION") as never, context))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Verification email sent.");
    expect(prisma.emailVerification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 9, token: expect.any(String), expiresAt: expect.any(Date) }),
    });
    expect(sendEmailVerificationEmail).toHaveBeenCalledWith("person@example.com", expect.any(String));
    expect(prisma.adminUserActionAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 42,
        targetUserId: 9,
        action: "RESEND_VERIFICATION",
        status: "SUCCEEDED",
      }),
    });
  });

  it("does not send verification to an already verified account", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 9,
      email: "person@example.com",
      emailVerified: true,
    } as never);

    const response = (await POST(request("RESEND_VERIFICATION") as never, context))!;

    expect(response.status).toBe(409);
    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it("rate limits repeated verification emails", async () => {
    vi.mocked(prisma.emailVerification.findFirst).mockResolvedValueOnce({ id: 5 } as never);

    const response = (await POST(request("RESEND_VERIFICATION") as never, context))!;

    expect(response.status).toBe(429);
    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends and audits a password-reset email without returning its token", async () => {
    const response = (await POST(request("SEND_PASSWORD_RESET") as never, context))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: "Password-reset email sent." });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("person@example.com", expect.any(String));
    expect(prisma.adminUserActionAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "SEND_PASSWORD_RESET", status: "SUCCEEDED" }),
    });
  });

  it("does not misreport a sent email when audit persistence fails", async () => {
    vi.mocked(prisma.adminUserActionAudit.create).mockRejectedValueOnce(new Error("Audit unavailable"));

    const response = (await POST(request("SEND_PASSWORD_RESET") as never, context))!;

    expect(response.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
    expect(prisma.passwordReset.delete).not.toHaveBeenCalled();
  });

  it("removes the reset token and records a failed email", async () => {
    vi.mocked(sendPasswordResetEmail).mockRejectedValueOnce(new Error("Provider unavailable"));

    const response = (await POST(request("SEND_PASSWORD_RESET") as never, context))!;

    expect(response.status).toBe(502);
    expect(prisma.passwordReset.delete).toHaveBeenCalledWith({ where: { token: expect.any(String) } });
    expect(prisma.adminUserActionAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "SEND_PASSWORD_RESET", status: "FAILED" }),
    });
  });
});
