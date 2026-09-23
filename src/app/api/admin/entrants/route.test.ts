import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/currentTournament", () => ({ getCurrentTournament: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendCompetitionInvitationEmail: vi.fn() }));

const tx = {
  competitionEntry: { upsert: vi.fn(), update: vi.fn() },
  competitionInvitation: { upsert: vi.fn(), update: vi.fn() },
  adminUserActionAudit: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: { findUnique: vi.fn(), findMany: vi.fn() },
    user: { findFirst: vi.fn() },
    competitionEntry: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    competitionInvitation: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    adminUserActionAudit: { create: vi.fn() },
    $transaction: vi.fn(async (argument: unknown) => typeof argument === "function"
      ? (argument as (client: typeof tx) => unknown)(tx)
      : Promise.all(argument as Promise<unknown>[])),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCurrentTournament } from "@/lib/currentTournament";
import { sendCompetitionInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

const tournament = { id: 7, year: 2027, name: "Six Nations Championship", status: "OPEN" };
const user = { id: 9, firstName: "Sean", lastName: "Durcan", email: "sean@example.com", paymentStatus: "COMPLETED", paidAt: new Date(), deletedAt: null };

function post(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/entrants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

describe("admin entrant management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ authorized: true, user: { id: 42, role: "ADMIN" } } as never);
    vi.mocked(getCurrentTournament).mockResolvedValue(tournament as never);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(tournament as never);
    vi.mocked(prisma.tournament.findMany).mockResolvedValue([tournament] as never);
    vi.mocked(sendCompetitionInvitationEmail).mockResolvedValue({ id: "email-1" } as never);
    vi.mocked(tx.competitionEntry.upsert).mockResolvedValue({ id: 1 } as never);
    vi.mocked(tx.competitionEntry.update).mockResolvedValue({ id: 1 } as never);
    vi.mocked(tx.competitionInvitation.upsert).mockResolvedValue({ id: 21 } as never);
    vi.mocked(tx.adminUserActionAudit.create).mockResolvedValue({ id: 1 } as never);
  });

  it("requires administrator access", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce({ authorized: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) } as never);
    const response = (await GET(new Request("http://localhost/api/admin/entrants") as never))!;
    expect(response.status).toBe(401);
    expect(prisma.tournament.findMany).not.toHaveBeenCalled();
  });

  it("returns filtered entrant status and pending invitation totals", async () => {
    vi.mocked(prisma.competitionEntry.count).mockResolvedValue(1);
    vi.mocked(prisma.competitionEntry.groupBy).mockResolvedValue([{ status: "ENTERED", _count: { _all: 4 } }] as never);
    vi.mocked(prisma.competitionInvitation.count).mockResolvedValue(2);
    vi.mocked(prisma.competitionEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.competitionInvitation.findMany).mockResolvedValue([]);

    const response = (await GET(new Request("http://localhost/api/admin/entrants?tournamentId=7&status=ENTERED&payment=COMPLETED&verification=VERIFIED") as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totals).toEqual({ invited: 0, entered: 4, withdrawn: 0, pendingInvitations: 2 });
    expect(prisma.competitionEntry.count).toHaveBeenCalledWith({ where: expect.objectContaining({ tournamentId: 7, status: "ENTERED", paymentStatus: "COMPLETED", user: expect.objectContaining({ emailVerified: true }) }) });
  });

  it("adds an existing account without changing payment or predictions", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(user as never);
    vi.mocked(prisma.competitionEntry.findUnique).mockResolvedValue(null);

    const response = (await POST(post({ action: "ADD", tournamentId: 7, email: "SEAN@example.com", confirmed: true }) as never))!;

    expect(response.status).toBe(200);
    expect(tx.competitionEntry.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ userId: 9, tournamentId: 7, status: "ENTERED" }),
      update: { status: "ENTERED", withdrawnFromStatus: null },
    }));
    expect(tx.competitionEntry.upsert).not.toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ paymentStatus: "COMPLETED" }),
    }));
    expect(tx.adminUserActionAudit.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "ADD_ENTRANT", targetUserId: 9 }) });
  });

  it("creates and emails a secure registration invitation for a new person", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const response = (await POST(post({ action: "INVITE", tournamentId: 7, email: "new@example.com", firstName: "New", confirmed: true }) as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invitationId).toBe(21);
    expect(tx.competitionInvitation.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ tournamentId: 7, email: "new@example.com", invitedById: 42 }),
    }));
    expect(sendCompetitionInvitationEmail).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", competitionName: "2027 Six Nations Championship", registrationToken: expect.any(String) }));
    expect(tx.adminUserActionAudit.create).toHaveBeenCalledWith({ data: expect.objectContaining({ targetUserId: null, targetReference: "Invitation 21", action: "INVITE_ENTRANT" }) });
  });

  it("keeps an invitation when email delivery fails and returns a warning", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(sendCompetitionInvitationEmail).mockRejectedValueOnce(new Error("Provider unavailable"));

    const response = (await POST(post({ action: "INVITE", tournamentId: 7, email: "new@example.com", confirmed: true }) as never))!;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.warning).toContain("could not be sent");
    expect(tx.competitionInvitation.upsert).toHaveBeenCalled();
  });

  it("withdraws an entrant while retaining their prior status", async () => {
    vi.mocked(prisma.competitionEntry.findFirst).mockResolvedValue({ id: 30, userId: 9, status: "ENTERED", user } as never);

    const response = (await POST(post({ action: "WITHDRAW", tournamentId: 7, entryId: 30, confirmed: true }) as never))!;

    expect(response.status).toBe(200);
    expect(prisma.competitionEntry.update).toHaveBeenCalledWith({ where: { id: 30 }, data: { withdrawnFromStatus: "ENTERED", status: "WITHDRAWN" } });
    expect(prisma.adminUserActionAudit.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "WITHDRAW_ENTRANT", targetUserId: 9 }) });
  });

  it("restores a withdrawn invitation to its previous invited status", async () => {
    vi.mocked(prisma.competitionEntry.findFirst).mockResolvedValue({ id: 30, userId: 9, status: "WITHDRAWN", withdrawnFromStatus: "INVITED", user } as never);

    const response = (await POST(post({ action: "RESTORE", tournamentId: 7, entryId: 30, confirmed: true }) as never))!;

    expect(response.status).toBe(200);
    expect(prisma.competitionEntry.update).toHaveBeenCalledWith({ where: { id: 30 }, data: { status: "INVITED", withdrawnFromStatus: null } });
  });

  it("rejects unconfirmed state changes", async () => {
    const response = (await POST(post({ action: "WITHDRAW", tournamentId: 7, entryId: 30 }) as never))!;
    expect(response.status).toBe(400);
    expect(prisma.competitionEntry.findFirst).not.toHaveBeenCalled();
  });
});
