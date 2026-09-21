import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/currentTournament", () => ({ getCurrentTournament: vi.fn() }));
vi.mock("@/lib/resend", () => ({
  resend: { emails: { send: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    announcementCampaign: { findUnique: vi.fn() },
    announcementDelivery: { create: vi.fn() },
    emailPreferenceToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { getCurrentTournament } from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildAnnouncementEmail,
  consumeEmailPreferenceToken,
  getAnnouncementAudienceCount,
  prepareAnnouncementDraft,
  sendAnnouncementTest,
} from "./announcements";

const validDraft = {
  subject: "The 2028 competition is coming",
  heading: "Perfect XV returns",
  message: "The next competition is being prepared.",
  actionLabel: "Visit Perfect XV",
  actionUrl: "https://perfect-xv.org",
  audience: "ALL_VERIFIED" as const,
};

describe("announcement email foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (callback: (tx: typeof prisma) => unknown) => callback(prisma)) as never
    );
  });

  it("validates a complete draft and rejects unsafe action links", () => {
    expect(prepareAnnouncementDraft(validDraft).errors).toEqual([]);
    expect(prepareAnnouncementDraft({
      ...validDraft,
      actionUrl: "javascript:alert(1)",
    }).errors).toContain("The action link must be a valid HTTP or HTTPS address.");
  });

  it("escapes administrator content in the generated email", () => {
    const email = buildAnnouncementEmail({
      ...validDraft,
      message: "Hello <script>alert('x')</script>",
    }, {
      unsubscribeUrl: "https://perfect-xv.org/unsubscribe",
      testMode: true,
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Test email");
  });

  it("counts only eligible current entrants for the selected audience", async () => {
    vi.mocked(getCurrentTournament).mockResolvedValue({ id: 7 } as never);
    vi.mocked(prisma.user.count).mockResolvedValue(12);

    await expect(getAnnouncementAudienceCount("CURRENT_ENTRANTS")).resolves.toBe(12);
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        emailVerified: true,
        deletedAt: null,
        announcementOptOutAt: null,
        competitionEntries: {
          some: { tournamentId: 7, status: "ENTERED" },
        },
      },
    });
  });

  it("uses a test unsubscribe token without changing the user preference", async () => {
    vi.mocked(prisma.emailPreferenceToken.findUnique).mockResolvedValue({
      id: 3,
      userId: 42,
      testOnly: true,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.emailPreferenceToken.update).mockResolvedValue({} as never);

    await expect(consumeEmailPreferenceToken("test-token")).resolves.toEqual({ testOnly: true });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("records a live unsubscribe preference", async () => {
    vi.mocked(prisma.emailPreferenceToken.findUnique).mockResolvedValue({
      id: 4,
      userId: 21,
      testOnly: false,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.emailPreferenceToken.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await expect(consumeEmailPreferenceToken("live-token")).resolves.toEqual({ testOnly: false });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: { announcementOptOutAt: expect.any(Date) },
    });
  });

  it("sends a test only to the authenticated administrator and records it", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.mocked(prisma.announcementCampaign.findUnique).mockResolvedValue({
      id: 9,
      ...validDraft,
      status: "DRAFT",
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 42,
      email: "admin@example.com",
      deletedAt: null,
    } as never);
    vi.mocked(prisma.emailPreferenceToken.create).mockResolvedValue({} as never);
    vi.mocked(resend.emails.send).mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    } as never);
    vi.mocked(prisma.announcementDelivery.create).mockResolvedValue({} as never);

    await expect(sendAnnouncementTest(9, 42)).resolves.toEqual({
      recipientEmail: "admin@example.com",
      providerMessageId: "email_123",
    });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        subject: "[TEST] The 2028 competition is coming",
      })
    );
    vi.unstubAllEnvs();
  });
});
