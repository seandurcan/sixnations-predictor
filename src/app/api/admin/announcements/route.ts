import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  ANNOUNCEMENT_AUDIENCES,
  getAnnouncementAudienceCount,
  prepareAnnouncementDraft,
} from "@/lib/email/announcements";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const [campaigns, ...counts] = await Promise.all([
    prisma.announcementCampaign.findMany({
      where: { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { _count: { select: { testDeliveries: true } } },
    }),
    ...ANNOUNCEMENT_AUDIENCES.map((audience) =>
      getAnnouncementAudienceCount(audience)
    ),
  ]);

  return NextResponse.json({
    success: true,
    campaigns,
    audienceCounts: Object.fromEntries(
      ANNOUNCEMENT_AUDIENCES.map((audience, index) => [audience, counts[index]])
    ),
    bulkSendingEnabled: false,
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
      include: { _count: { select: { testDeliveries: true } } },
    });
  } else {
    campaign = await prisma.announcementCampaign.create({
      data: {
        ...prepared.draft,
        status: "DRAFT",
        createdByUserId: adminUserId,
      },
      include: { _count: { select: { testDeliveries: true } } },
    });
  }

  return NextResponse.json(
    { success: true, campaign },
    { status: Number.isInteger(campaignId) && campaignId > 0 ? 200 : 201 }
  );
}
