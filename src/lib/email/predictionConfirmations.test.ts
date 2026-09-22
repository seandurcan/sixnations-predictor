import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn(), findMany: vi.fn() },
    tournament: { findUnique: vi.fn(), findMany: vi.fn() },
    predictionConfirmationDelivery: { upsert: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  },
}));

import { resend } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { buildPredictionConfirmationEmail, sendPredictionConfirmation } from "./predictionConfirmations";

describe("prediction confirmation emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 4, firstName: "Sean", email: "sean@example.com", emailVerified: true } as never);
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      id: 2,
      name: "Perfect XV",
      year: 2027,
      matches: [{
        matchNumber: 1,
        homeTeam: { name: "Ireland" },
        awayTeam: { name: "France" },
        predictions: [{ predictedHomeScore: 24, predictedAwayScore: 20 }],
      }],
    } as never);
    vi.mocked(prisma.predictionConfirmationDelivery.upsert).mockResolvedValue({ id: 9, status: "PENDING" } as never);
    vi.mocked(prisma.predictionConfirmationDelivery.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.predictionConfirmationDelivery.update).mockResolvedValue({ id: 9, status: "SENT" } as never);
    vi.mocked(resend.emails.send).mockResolvedValue({ data: { id: "email-1" }, error: null } as never);
  });

  it("lists every fixture and clearly marks the predictions as locked", () => {
    const message = buildPredictionConfirmationEmail({
      firstName: "Sean",
      tournamentName: "Perfect XV",
      tournamentYear: 2027,
      predictions: [{ matchNumber: 1, homeTeam: "Ireland", awayTeam: "France", homeScore: 24, awayScore: 20 }],
    });
    expect(message.subject).toContain("locked predictions");
    expect(message.text).toContain("Ireland v France: 24-20");
    expect(message.text).toContain("cannot be changed");
  });

  it("uses a deterministic idempotency key and records a successful send", async () => {
    const result = await sendPredictionConfirmation(4, 2);
    expect(result.skipped).toBe(false);
    expect(resend.emails.send).toHaveBeenCalledWith(expect.objectContaining({ to: "sean@example.com" }), {
      idempotencyKey: "prediction-confirmation-2-4",
    });
    expect(prisma.predictionConfirmationDelivery.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 9 },
      data: expect.objectContaining({ status: "SENT", providerMessageId: "email-1" }),
    }));
  });

  it("does not send a second automatic email after a successful delivery", async () => {
    vi.mocked(prisma.predictionConfirmationDelivery.upsert).mockResolvedValueOnce({ id: 9, status: "SENT" } as never);
    const result = await sendPredictionConfirmation(4, 2);
    expect(result.skipped).toBe(true);
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("records provider failures for safe administrator retry", async () => {
    vi.mocked(resend.emails.send).mockResolvedValueOnce({ data: null, error: { message: "Rejected" } } as never);
    await expect(sendPredictionConfirmation(4, 2)).rejects.toThrow("Rejected");
    expect(prisma.predictionConfirmationDelivery.update).toHaveBeenLastCalledWith({
      where: { id: 9 },
      data: { status: "FAILED", errorMessage: "Rejected" },
    });
  });
});
