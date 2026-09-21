import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  ANNOUNCEMENT_AUDIENCES,
  getAnnouncementAudienceCount,
  prepareAnnouncementDraft,
} from "@/lib/email/announcements";
import {
  ANNOUNCEMENT_BATCH_SIZE,
  getAnnouncementDeliverySummaries,
} from "@/lib/email/announcementDelivery";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const campaigns = await prisma.announcementCampaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
  const [summaries, ...counts] = await Promise.all([
    getAnnouncementDeliverySummaries(campaigns.map((campaign) => campaign.id)),
    ...ANNOUNCEMENT_AUDIENCES.map((audience) =>
      getAnnouncementAudienceCount(audience)
    ),
  ]);

  return NextResponse.json({
    success: true,
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      deliverySummary: summaries[campaign.id],
    })),
    audienceCounts: Object.fromEntries(
      ANNOUNCEMENT_AUDIENCES.map((audience, index) => [audience, counts[index]])
    ),
    bulkSendingEnabled: true,
    batchSize: ANNOUNCEMENT_BATCH_SIZE,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) {
    return NextResponse.json(
      { success: false, error: "Authenticated administrator could not be identified." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const campaignId = Number(body.campaignId);
  const prepared = prepareAnnouncementDraft(body);
  if (!prepared.draft || prepared.errors.length > 0) {
    return NextResponse.json(
      { success: false, error: prepared.errors.join(" ") },
      { status: 400 }
    );
  }

  let campaign;
  if (Number.isInteger(campaignId) && campaignId > 0) {
    const existing = await prisma.announcementCampaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    });
    if (!existing || existing.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Only an existing draft announcement can be updated." },
        { status: 409 }
      );
    }
    campaign = await prisma.announcementCampaign.update({
      where: { id: campaignId },
      data: prepared.draft,
    });
  } else {
    campaign = await prisma.announcementCampaign.create({
      data: {
        ...prepared.draft,
        status: "DRAFT",
        createdByUserId: adminUserId,
      },
    });
  }

  return NextResponse.json(
    { success: true, campaign },
    { status: Number.isInteger(campaignId) && campaignId > 0 ? 200 : 201 }
  );
}
