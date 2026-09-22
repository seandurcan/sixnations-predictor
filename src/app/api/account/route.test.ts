import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  passwordReset: { deleteMany: vi.fn() },
  emailVerification: { deleteMany: vi.fn(), create: vi.fn() },
  emailPreferenceToken: { deleteMany: vi.fn() },
  user: { update: vi.fn() },
};

vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmailVerificationEmail: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    emailVerification: { delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { sendEmailVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { GET, PATCH } from "./route";

const currentUser = {
  id: 7,
  firstName: "Old",
  lastName: "Name",
  email: "old@example.com",
  mobile: "0870000000",
  emailVerified: true,
  passwordHash: "hash",
};

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/account", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("self-service account details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.emailVerification.delete).mockResolvedValue({} as never);
    vi.mocked(sendEmailVerificationEmail).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as never));
  });

  it("requires an authenticated account", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await PATCH(request({}) as never)).status).toBe(401);
  });

  it("returns only editable account details", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: 7,
      firstName: "Old",
      lastName: "Name",
      email: "old@example.com",
      mobile: "0870000000",
      emailVerified: true,
    });
    expect(body.user.passwordHash).toBeUndefined();
  });

  it("updates name and mobile without requiring a password or changing security links", async () => {
    const response = await PATCH(request({
      firstName: "New", lastName: "Name", email: "old@example.com", mobile: "0871111111",
    }) as never);
    expect(response.status).toBe(200);
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(tx.passwordReset.deleteMany).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { firstName: "New", lastName: "Name", email: "old@example.com", mobile: "0871111111" },
    });
  });

  it("requires the current password and prevents a duplicate email", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
    const wrongPassword = await PATCH(request({
      ...currentUser, email: "new@example.com", currentPassword: "wrong",
    }) as never);
    expect(wrongPassword.status).toBe(403);

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 8 } as never);
    const duplicate = await PATCH(request({
      ...currentUser, email: "used@example.com", currentPassword: "correct",
    }) as never);
    expect(duplicate.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("invalidates old links, marks the new email unverified and sends fresh verification", async () => {
    const response = await PATCH(request({
      ...currentUser, email: "NEW@example.com", currentPassword: "correct",
    }) as never);
    expect(response.status).toBe(200);
    expect(tx.passwordReset.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(tx.emailVerification.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(tx.emailPreferenceToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({ email: "new@example.com", emailVerified: false }),
    });
    expect(sendEmailVerificationEmail).toHaveBeenCalledWith("new@example.com", expect.any(String));
  });

  it("retains the saved details and removes an undelivered token if email delivery fails", async () => {
    vi.mocked(sendEmailVerificationEmail).mockRejectedValueOnce(new Error("Provider unavailable"));
    const response = await PATCH(request({
      ...currentUser, email: "new@example.com", currentPassword: "correct",
    }) as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.warning).toContain("Resend Verification");
    expect(prisma.emailVerification.delete).toHaveBeenCalledWith({ where: { token: expect.any(String) } });
  });
});
