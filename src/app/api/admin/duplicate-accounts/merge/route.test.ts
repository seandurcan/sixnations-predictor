import { beforeEach, describe, expect, it, vi } from "vitest";

const emptyModel = () => ({ findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn(), deleteMany: vi.fn() });
const tx = {
  user: { findMany: vi.fn(), update: vi.fn() },
  duplicateAccountReview: { findUnique: vi.fn(), deleteMany: vi.fn() },
  prediction: emptyModel(),
  competitionEntry: emptyModel(),
  payment: { updateMany: vi.fn() },
  predictionSubmission: { updateMany: vi.fn() },
  leaderboardSnapshot: emptyModel(),
  tournamentWinner: emptyModel(),
  predictionConfirmationDelivery: emptyModel(),
  announcementDelivery: { updateMany: vi.fn() },
  session: { deleteMany: vi.fn() },
  passwordReset: { deleteMany: vi.fn() },
  emailVerification: { deleteMany: vi.fn() },
  emailPreferenceToken: { deleteMany: vi.fn() },
  adminUserActionAudit: { create: vi.fn() },
};

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    duplicateAccountReview: { findUnique: vi.fn() },
    prediction: { findMany: vi.fn() },
    competitionEntry: { findMany: vi.fn() },
    payment: { count: vi.fn() },
    predictionSubmission: { count: vi.fn() },
    leaderboardSnapshot: { findMany: vi.fn() },
    tournamentWinner: { findMany: vi.fn() },
    predictionConfirmationDelivery: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const users = [
  { id: 2, firstName: "Sean", lastName: "Durcan", email: "survivor@example.com", role: "USER", paymentStatus: "COMPLETED", paidAt: new Date(), predictionsSubmitted: true, predictionSubmittedAt: new Date() },
  { id: 5, firstName: "S", lastName: "Durcan", email: "other@example.com", role: "USER", paymentStatus: "PENDING", paidAt: null, predictionsSubmitted: false, predictionSubmittedAt: null },
];

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/duplicate-accounts/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("controlled duplicate account merge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ authorized: true, user: { id: 1, role: "ADMIN" } } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue(users as never);
    vi.mocked(prisma.duplicateAccountReview.findUnique).mockResolvedValue({ decision: "SAME_PERSON" } as never);
    vi.mocked(prisma.prediction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.competitionEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.payment.count).mockResolvedValue(1);
    vi.mocked(prisma.predictionSubmission.count).mockResolvedValue(2);
    vi.mocked(prisma.leaderboardSnapshot.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tournamentWinner.findMany).mockResolvedValue([]);
    vi.mocked(prisma.predictionConfirmationDelivery.findMany).mockResolvedValue([]);
    tx.user.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    tx.duplicateAccountReview.findUnique.mockResolvedValue({ decision: "SAME_PERSON" });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as never));
  });

  it("provides a dry-run without changing either account", async () => {
    const response = (await POST(request({ action: "preview", firstUserId: 2, secondUserId: 5, survivorUserId: 2 }) as never))!;
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.preview).toMatchObject({ survivor: { id: 2 }, redundant: { id: 5 }, transfers: { payments: 1, submissions: 2 } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("requires the surviving email exactly before merging", async () => {
    const response = (await POST(request({ action: "merge", firstUserId: 2, secondUserId: 5, survivorUserId: 2, conflictResolution: "KEEP_SURVIVOR", confirmationEmail: "wrong@example.com" }) as never))!;
    expect(response.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("transfers records, disables the redundant login and creates an audit", async () => {
    const response = (await POST(request({ action: "merge", firstUserId: 2, secondUserId: 5, survivorUserId: 2, conflictResolution: "KEEP_SURVIVOR", confirmationEmail: "survivor@example.com" }) as never))!;
    expect(response.status).toBe(200);
    expect(tx.payment.updateMany).toHaveBeenCalledWith({ where: { userId: 5 }, data: { userId: 2 } });
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 5 } });
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 5 },
      data: expect.objectContaining({ firstName: "Merged", deletedAt: expect.any(Date), emailVerified: false }),
    }));
    expect(tx.adminUserActionAudit.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "MERGE_ACCOUNTS", targetUserId: 5 }) });
  });

  it("refuses any merge involving an administrator account", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([{ ...users[0], role: "ADMIN" }, users[1]] as never);
    const response = (await POST(request({ action: "preview", firstUserId: 2, secondUserId: 5, survivorUserId: 2 }) as never))!;
    expect(response.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
