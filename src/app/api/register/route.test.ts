import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn((callback: () => unknown) => void callback()) };
});
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed-password") } }));
vi.mock("@/lib/email", () => ({ sendEmailVerificationEmail: vi.fn().mockResolvedValue({ id: "mail-1" }) }));
vi.mock("@/lib/currentTournament", () => ({ getCurrentTournament: vi.fn() }));

const tx = {
  user: { create: vi.fn() },
  emailVerification: { create: vi.fn() },
  competitionEntry: { upsert: vi.fn(), create: vi.fn() },
  competitionInvitation: { update: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn(), count: vi.fn() },
    competitionInvitation: { findUnique: vi.fn() },
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  },
}));

import crypto from "crypto";
import { getCurrentTournament } from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

function registration(invitationToken = "") {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName: "New", lastName: "Entrant", email: "INVITED@example.com", mobile: "0870000000", password: "Strong!123", confirmPassword: "Strong!123", invitationToken }),
  });
}

describe("registration invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.count).mockResolvedValue(10);
    vi.mocked(getCurrentTournament).mockResolvedValue({ id: 7 } as never);
    vi.mocked(tx.user.create).mockResolvedValue({ id: 11, email: "invited@example.com" } as never);
    vi.mocked(tx.emailVerification.create).mockResolvedValue({ id: 1 } as never);
    vi.mocked(tx.competitionEntry.upsert).mockResolvedValue({ id: 2 } as never);
    vi.mocked(tx.competitionInvitation.update).mockResolvedValue({ id: 3 } as never);
  });

  it("links a valid invitation to the new account and competition", async () => {
    const token = "secure-invitation-token";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    vi.mocked(prisma.competitionInvitation.findUnique).mockResolvedValue({ id: 3, tournamentId: 7, email: "invited@example.com", tokenHash, status: "PENDING", expiresAt: new Date(Date.now() + 60_000) } as never);

    const response = await POST(registration(token));

    expect(response.status).toBe(200);
    expect(prisma.competitionInvitation.findUnique).toHaveBeenCalledWith({ where: { tokenHash } });
    expect(tx.competitionEntry.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { userId: 11, tournamentId: 7, status: "INVITED" } }));
    expect(tx.competitionInvitation.update).toHaveBeenCalledWith({ where: { id: 3 }, data: expect.objectContaining({ status: "ACCEPTED", acceptedUserId: 11, acceptedAt: expect.any(Date) }) });
  });

  it("rejects an expired invitation before creating an account", async () => {
    vi.mocked(prisma.competitionInvitation.findUnique).mockResolvedValue({ id: 3, tournamentId: 7, email: "invited@example.com", status: "PENDING", expiresAt: new Date(Date.now() - 60_000) } as never);

    const response = await POST(registration("expired-token"));

    expect(response.status).toBe(400);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it("normalises email addresses for ordinary registration", async () => {
    const response = await POST(registration());

    expect(response.status).toBe(200);
    expect(tx.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: "invited@example.com" }) });
    expect(tx.competitionEntry.upsert).not.toHaveBeenCalled();
    expect(tx.competitionEntry.create).toHaveBeenCalledWith({ data: { userId: 11, tournamentId: 7, status: "INVITED" } });
  });
});
