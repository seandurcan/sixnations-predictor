import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email/announcements", () => ({
  buildAnnouncementEmail: vi.fn(() => ({ html: "<p>Announcement</p>", text: "Announcement" })),
  createEmailPreferenceToken: vi.fn(() => Promise.resolve("unsubscribe-token")),
  getAnnouncementAudienceWhere: vi.fn(() => Promise.resolve({ emailVerified: true })),
}));
vi.mock("@/lib/resend", () => ({
  resend: { batch: { send: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    announcementCampaign: { findUnique: vi.fn(), update: vi.fn() },
    announcementDelivery: {
      count: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), groupBy: vi.fn(),
      update: vi.fn(), updateMany: vi.fn(),
    },
    user: { findMany: vi.fn() },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  freezeAnnouncementRecipients,
  retryFailedAnnouncementDeliveries,
  sendNextAnnouncementBatch,
} from "./announcementDelivery";

const campaign = {
  id: 8,
  status: "DRAFT",
  audience: "ALL_VERIFIED",
  subject: "Perfect XV returns",
  heading: "The next tournament",
  message: "Entries will open soon.",
  actionLabel: null,
  actionUrl: null,
};

describe("controlled announcement delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (callback: (tx: typeof prisma) => unknown) => callback(prisma)) as never
    );
    vi.mocked(prisma.$executeRaw).mockResolvedValue(0);
    vi.mocked(prisma.announcementCampaign.update).mockResolvedValue({} as never);
    vi.mocked(prisma.announcementDelivery.update).mockResolvedValue({} as never);
    vi.mocked(prisma.announcementDelivery.updateMany).mockResolvedValue({ count: 0 });
  });

  it("freezes an exact audience only after a successful test", async () => {
    vi.mocked(prisma.announcementCampaign.findUnique).mockResolvedValue(campaign as never);
    vi.mocked(prisma.announcementDelivery.count).mockResolvedValue(1);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 2, email: "Two@Example.com" },
      { id: 5, email: "five@example.com" },
    ] as never);
    vi.mocked(prisma.announcementDelivery.createMany).mockResolvedValue({ count: 2 });

    await expect(freezeAnnouncementRecipients(8, 99, 2)).resolves.toEqual({
      campaignId: 8, recipientCount: 2, status: "READY",
    });
    expect(prisma.announcementDelivery.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ recipientUserId: 2, recipientEmail: "two@example.com", status: "PENDING" }),
        expect.objectContaining({ recipientUserId: 5, recipientEmail: "five@example.com", status: "PENDING" }),
      ],
      skipDuplicates: true,
    });
    expect(prisma.announcementCampaign.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "READY", confirmedByUserId: 99, recipientCount: 2 }),
    }));
  });

  it("stops confirmation when the eligible count changed", async () => {
    vi.mocked(prisma.announcementCampaign.findUnique).mockResolvedValue(campaign as never);
    vi.mocked(prisma.announcementDelivery.count).mockResolvedValue(1);
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 2, email: "two@example.com" }] as never);

    await expect(freezeAnnouncementRecipients(8, 99, 2)).rejects.toThrow(
      "eligible audience changed from 2 to 1"
    );
    expect(prisma.announcementDelivery.createMany).not.toHaveBeenCalled();
  });

  it("rechecks preferences, skips opted-out users, and sends only one claimed batch", async () => {
    const readyCampaign = { ...campaign, status: "READY" };
    const deliveries = [
      { id: 11, campaignId: 8, recipientUserId: 2, recipientEmail: "two@example.com", unsubscribeToken: null },
      { id: 12, campaignId: 8, recipientUserId: 5, recipientEmail: "five@example.com", unsubscribeToken: null },
    ];
    vi.mocked(prisma.announcementCampaign.findUnique).mockResolvedValue(readyCampaign as never);
    vi.mocked(prisma.announcementDelivery.findMany).mockResolvedValue(deliveries as never);
    vi.mocked(prisma.announcementDelivery.updateMany)
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 2 });
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 2, email: "two@example.com", emailVerified: true, deletedAt: null, announcementOptOutAt: null },
      { id: 5, email: "five@example.com", emailVerified: true, deletedAt: null, announcementOptOutAt: new Date() },
    ] as never);
    vi.mocked(resend.batch.send).mockResolvedValue({
      data: { data: [{ id: "provider-11" }], errors: null }, error: null,
    } as never);
    vi.mocked(prisma.announcementDelivery.groupBy).mockResolvedValue([
      { campaignId: 8, deliveryType: "BULK", status: "SENT", _count: { _all: 1 } },
      { campaignId: 8, deliveryType: "BULK", status: "SKIPPED", _count: { _all: 1 } },
    ] as never);

    await expect(sendNextAnnouncementBatch(8)).resolves.toEqual(expect.objectContaining({
      campaignId: 8, processed: 2,
    }));
    expect(resend.batch.send).toHaveBeenCalledWith(
      [expect.objectContaining({ to: "two@example.com" })],
      expect.objectContaining({ batchValidation: "permissive" })
    );
    expect(prisma.announcementDelivery.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: expect.objectContaining({ status: "SKIPPED" }),
    });
    expect(prisma.announcementDelivery.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: expect.objectContaining({ status: "SENT", providerMessageId: "provider-11" }),
    });
  });

  it("queues only failed deliveries for an explicit later retry", async () => {
    vi.mocked(prisma.announcementCampaign.findUnique).mockResolvedValue({ ...campaign, status: "READY" } as never);
    vi.mocked(prisma.announcementDelivery.updateMany).mockResolvedValue({ count: 3 });

    await expect(retryFailedAnnouncementDeliveries(8)).resolves.toEqual({ campaignId: 8, queued: 3 });
    expect(prisma.announcementDelivery.updateMany).toHaveBeenCalledWith({
      where: { campaignId: 8, deliveryType: "BULK", status: "FAILED" },
      data: { status: "PENDING", errorMessage: null },
    });
    expect(resend.batch.send).not.toHaveBeenCalled();
  });
});
