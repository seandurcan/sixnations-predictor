import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: vi.fn(), update: vi.fn() },
  competitionEntry: { upsert: vi.fn() },
  payment: { findFirst: vi.fn(), create: vi.fn() },
} }));
vi.mock("@/lib/stripe", () => ({ stripe: { webhooks: { constructEvent: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { POST } from "./route";

describe("Stripe webhook entrant synchronisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_test", payment_status: "paid", metadata: { userId: "9", tournamentId: "7" }, amount_total: 2000, currency: "eur" } },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 9, email: "entrant@example.com" } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 9, email: "entrant@example.com", paymentStatus: "COMPLETED", paidAt: new Date("2026-09-23T10:00:00Z") } as never);
    vi.mocked(prisma.competitionEntry.upsert).mockResolvedValue({ id: 4 } as never);
    vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.payment.create).mockResolvedValue({ id: 5 } as never);
  });

  it("marks the matching competition entry entered and paid", async () => {
    const response = await POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": "valid" }, body: "event" }) as never);

    expect(response.status).toBe(200);
    expect(prisma.competitionEntry.upsert).toHaveBeenCalledWith({
      where: { userId_tournamentId: { userId: 9, tournamentId: 7 } },
      update: { status: "ENTERED", paymentStatus: "COMPLETED", paidAt: expect.any(Date), withdrawnFromStatus: null },
      create: { userId: 9, tournamentId: 7, status: "ENTERED", paymentStatus: "COMPLETED", paidAt: expect.any(Date) },
    });
  });
});
