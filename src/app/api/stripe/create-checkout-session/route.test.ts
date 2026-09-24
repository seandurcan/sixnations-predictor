import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/currentTournament", () => ({ getTournamentByIdOrCurrent: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { competitionEntry: { upsert: vi.fn() } } }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } } } }));

import { requireUser } from "@/lib/auth";
import { getTournamentByIdOrCurrent } from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { POST } from "./route";

describe("Stripe competition checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: 9, email: "entrant@example.com", paymentStatus: "PENDING", paidAt: null } as never);
    vi.mocked(getTournamentByIdOrCurrent).mockResolvedValue({ id: 7, name: "Six Nations Championship", year: 2027, entryFee: 20, currency: "EUR" } as never);
    vi.mocked(prisma.competitionEntry.upsert).mockResolvedValue({ id: 2, paymentStatus: "PENDING" } as never);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: "https://checkout.example.test/session" } as never);
  });

  it("links checkout metadata and price to the selected competition", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(prisma.competitionEntry.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_tournamentId: { userId: 9, tournamentId: 7 } },
      create: expect.objectContaining({ status: "INVITED" }),
    }));
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: "9", email: "entrant@example.com", tournamentId: "7" },
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 2000 }) })],
    }));
  });

  it("refuses checkout when no competition is selected", async () => {
    vi.mocked(getTournamentByIdOrCurrent).mockResolvedValueOnce(null);
    const response = await POST();
    expect(response.status).toBe(409);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
