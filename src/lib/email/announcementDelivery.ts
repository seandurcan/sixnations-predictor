import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildAnnouncementEmail,
  createEmailPreferenceToken,
  getAnnouncementAudienceWhere,
} from "@/lib/email/announcements";

export const ANNOUNCEMENT_BATCH_SIZE = 25;
const STALE_BATCH_MINUTES = 15;
const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://perfect-xv.org"
).trim().replace(/\/+$/, "");
const FROM_ADDRESS = "Perfect XV <noreply@perfect-xv.org>";

export type DeliveryCounts = {
  total: number;
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  skipped: number;
};

export type CampaignDeliverySummary = {
  test: DeliveryCounts;
  bulk: DeliveryCounts;
};

function emptyCounts(): DeliveryCounts {
  return { total: 0, pending: 0, sending: 0, sent: 0, failed: 0, skipped: 0 };
}

function emptySummary(): CampaignDeliverySummary {
  return { test: emptyCounts(), bulk: emptyCounts() };
}

export async function getAnnouncementDeliverySummaries(campaignIds: number[]) {
  const summaries: Record<number, CampaignDeliverySummary> = Object.fromEntries(
    campaignIds.map((id) => [id, emptySummary()])
  );
  if (campaignIds.length === 0) return summaries;

  const groups = await prisma.announcementDelivery.groupBy({
    by: ["campaignId", "deliveryType", "status"],
    where: { campaignId: { in: campaignIds } },
    _count: { _all: true },
  });

  for (const group of groups) {
    const summary = summaries[group.campaignId] ?? emptySummary();
    summaries[group.campaignId] = summary;
    const counts = group.deliveryType === "TEST" ? summary.test : summary.bulk;
    const count = group._count._all;
    counts.total += count;
    if (group.status === "PENDING") counts.pending += count;
    if (group.status === "SENDING") counts.sending += count;
    if (group.status === "SENT") counts.sent += count;
    if (group.status === "FAILED") counts.failed += count;
    if (group.status === "SKIPPED") counts.skipped += count;
  }

  return summaries;
}

async function lockCampaign(
  database: Pick<typeof prisma, "$executeRaw">,
  campaignId: number
) {
  await database.$executeRaw`SELECT pg_advisory_xact_lock(${91_000 + campaignId})`;
}

export async function freezeAnnouncementRecipients(
  campaignId: number,
  adminUserId: number,
  expectedRecipientCount: number
) {
  const initialCampaign = await prisma.announcementCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!initialCampaign || initialCampaign.status !== "DRAFT") {
    throw new Error("Only a draft announcement can have its recipients confirmed.");
  }
  const audienceWhere = await getAnnouncementAudienceWhere(initialCampaign.audience);

  return prisma.$transaction(async (tx) => {
    await lockCampaign(tx, campaignId);
    const campaign = await tx.announcementCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.status !== "DRAFT") {
      throw new Error("Only a draft announcement can have its recipients confirmed.");
    }

    const successfulTests = await tx.announcementDelivery.count({
      where: {
        campaignId,
        deliveryType: "TEST",
        status: "SENT",
      },
    });
    if (successfulTests === 0) {
      throw new Error("Send and review a successful administrator test before confirming recipients.");
    }

    const recipients = await tx.user.findMany({
      where: audienceWhere,
      orderBy: { id: "asc" },
      select: { id: true, email: true },
    });
    if (recipients.length === 0) {
      throw new Error("The selected audience currently has no eligible recipients.");
    }
    if (recipients.length !== expectedRecipientCount) {
      throw new Error(
        `The eligible audience changed from ${expectedRecipientCount} to ${recipients.length}. Review the count and confirm again.`
      );
    }

    await tx.announcementDelivery.createMany({
      data: recipients.map((recipient) => ({
        campaignId,
        recipientUserId: recipient.id,
        recipientEmail: recipient.email.trim().toLowerCase(),
        deliveryType: "BULK" as const,
        status: "PENDING" as const,
        dedupeKey: `announcement-${campaignId}-user-${recipient.id}`,
      })),
      skipDuplicates: true,
    });
    await tx.announcementCampaign.update({
      where: { id: campaignId },
      data: {
        status: "READY",
        confirmedByUserId: adminUserId,
        recipientCount: recipients.length,
        confirmedAt: new Date(),
        sentAt: null,
        cancelledAt: null,
      },
    });

    return {
      campaignId,
      recipientCount: recipients.length,
      status: "READY" as const,
    };
  }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });
}

async function claimNextBatch(campaignId: number) {
  const staleBefore = new Date(
    Date.now() - STALE_BATCH_MINUTES * 60 * 1000
  );
  return prisma.$transaction(async (tx) => {
    await lockCampaign(tx, campaignId);
    const campaign = await tx.announcementCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || !["READY", "SENDING"].includes(campaign.status)) {
      throw new Error("This announcement is not ready to send.");
    }

    await tx.announcementDelivery.updateMany({
      where: {
        campaignId,
        deliveryType: "BULK",
        status: "SENDING",
        updatedAt: { lt: staleBefore },
      },
      data: {
        status: "PENDING",
        errorMessage: "A stale send attempt was safely reopened.",
      },
    });

    const deliveries = await tx.announcementDelivery.findMany({
      where: {
        campaignId,
        deliveryType: "BULK",
        status: "PENDING",
      },
      orderBy: { id: "asc" },
      take: ANNOUNCEMENT_BATCH_SIZE,
    });
    if (deliveries.length === 0) return { campaign, deliveries };

    const claimed = await tx.announcementDelivery.updateMany({
      where: {
        id: { in: deliveries.map((delivery) => delivery.id) },
        status: "PENDING",
      },
      data: {
        status: "SENDING",
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
        errorMessage: null,
      },
    });
    if (claimed.count !== deliveries.length) {
      throw new Error("The next delivery batch changed before it could be claimed. Try again.");
    }
    await tx.announcementCampaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    return { campaign, deliveries };
  }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });
}

async function finalizeCampaign(campaignId: number) {
  const summaries = await getAnnouncementDeliverySummaries([campaignId]);
  const summary = summaries[campaignId] ?? emptySummary();
  const unfinished = summary.bulk.pending + summary.bulk.sending;
  const complete = unfinished === 0 && summary.bulk.failed === 0;
  await prisma.announcementCampaign.update({
    where: { id: campaignId },
    data: {
      status: complete ? "SENT" : "READY",
      sentAt: complete ? new Date() : null,
    },
  });
  return summary;
}

export async function sendNextAnnouncementBatch(campaignId: number) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { campaign, deliveries } = await claimNextBatch(campaignId);
  if (deliveries.length === 0) {
    return {
      campaignId,
      processed: 0,
      summary: await finalizeCampaign(campaignId),
    };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: deliveries.flatMap((delivery) =>
      delivery.recipientUserId ? [delivery.recipientUserId] : []
    ) } },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      deletedAt: true,
      announcementOptOutAt: true,
    },
  });
  const usersById = new Map(users.map((user) => [user.id, user]));
  const eligible = [];

  for (const delivery of deliveries) {
    const user = delivery.recipientUserId
      ? usersById.get(delivery.recipientUserId)
      : null;
    const currentEmail = user?.email.trim().toLowerCase();
    let skipReason = "";
    if (!user || user.deletedAt) skipReason = "The user account is unavailable.";
    else if (!user.emailVerified) skipReason = "The user email is no longer verified.";
    else if (user.announcementOptOutAt) skipReason = "The user opted out after recipient confirmation.";
    else if (currentEmail !== delivery.recipientEmail) {
      skipReason = "The user email changed after recipient confirmation.";
    }

    if (skipReason) {
      await prisma.announcementDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SKIPPED",
          errorMessage: skipReason,
          unsubscribeToken: null,
        },
      });
    } else {
      eligible.push(delivery);
    }
  }

  const prepared = [];
  for (const delivery of eligible) {
    let unsubscribeToken = delivery.unsubscribeToken;
    if (!unsubscribeToken) {
      unsubscribeToken = await createEmailPreferenceToken(
        delivery.recipientUserId!,
        false,
        365
      );
      await prisma.announcementDelivery.update({
        where: { id: delivery.id },
        data: { unsubscribeToken },
      });
    }
    const unsubscribeUrl =
      `${APP_URL}/api/email-preferences/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    const email = buildAnnouncementEmail(campaign, { unsubscribeUrl });
    prepared.push({
      delivery: { ...delivery, unsubscribeToken },
      message: {
        from: FROM_ADDRESS,
        to: delivery.recipientEmail,
        subject: campaign.subject,
        html: email.html,
        text: email.text,
      },
    });
  }

  if (prepared.length > 0) {
    const batchFingerprint = crypto
      .createHash("sha256")
      .update(prepared.map(({ delivery }) => delivery.id).join(","))
      .digest("hex")
      .slice(0, 32);
    const { data, error } = await resend.batch.send(
      prepared.map(({ message }) => message),
      {
        idempotencyKey: `announcement-${campaignId}-${batchFingerprint}`,
        batchValidation: "permissive",
      }
    );

    if (error || !data) {
      await prisma.announcementDelivery.updateMany({
        where: { id: { in: prepared.map(({ delivery }) => delivery.id) } },
        data: {
          status: "FAILED",
          errorMessage: error?.message ?? "The email provider did not accept the batch.",
        },
      });
    } else {
      const errorsByIndex = new Map(
        (data.errors ?? []).map((item) => [item.index, item.message])
      );
      let acceptedIndex = 0;
      for (let index = 0; index < prepared.length; index++) {
        const item = prepared[index];
        const errorMessage = errorsByIndex.get(index);
        const providerMessageId = errorMessage
          ? null
          : data.data[acceptedIndex++]?.id ?? null;
        await prisma.announcementDelivery.update({
          where: { id: item.delivery.id },
          data: {
            status: errorMessage ? "FAILED" : "SENT",
            providerMessageId,
            errorMessage: errorMessage ?? null,
            unsubscribeToken: errorMessage ? item.delivery.unsubscribeToken : null,
          },
        });
      }
    }
  }

  return {
    campaignId,
    processed: deliveries.length,
    summary: await finalizeCampaign(campaignId),
  };
}

export async function retryFailedAnnouncementDeliveries(campaignId: number) {
  const updated = await prisma.$transaction(async (tx) => {
    await lockCampaign(tx, campaignId);
    const campaign = await tx.announcementCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || !["READY", "SENDING"].includes(campaign.status)) {
      throw new Error("This announcement does not have failed deliveries to retry.");
    }
    const result = await tx.announcementDelivery.updateMany({
      where: {
        campaignId,
        deliveryType: "BULK",
        status: "FAILED",
      },
      data: { status: "PENDING", errorMessage: null },
    });
    if (result.count === 0) {
      throw new Error("There are no failed deliveries to retry.");
    }
    await tx.announcementCampaign.update({
      where: { id: campaignId },
      data: { status: "READY", sentAt: null },
    });
    return result.count;
  }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });

  return { campaignId, queued: updated };
}

export async function cancelAnnouncementDelivery(campaignId: number) {
  const cancelled = await prisma.$transaction(async (tx) => {
    await lockCampaign(tx, campaignId);
    const campaign = await tx.announcementCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || !["READY", "SENDING"].includes(campaign.status)) {
      throw new Error("This announcement cannot be cancelled.");
    }
    const sending = await tx.announcementDelivery.count({
      where: { campaignId, deliveryType: "BULK", status: "SENDING" },
    });
    if (sending > 0) {
      throw new Error("Wait for the active batch to finish before cancelling.");
    }
    const result = await tx.announcementDelivery.updateMany({
      where: {
        campaignId,
        deliveryType: "BULK",
        status: { in: ["PENDING", "FAILED"] },
      },
      data: {
        status: "SKIPPED",
        errorMessage: "Cancelled by an administrator.",
        unsubscribeToken: null,
      },
    });
    await tx.announcementCampaign.update({
      where: { id: campaignId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    return result.count;
  }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });

  return { campaignId, cancelled };
}
