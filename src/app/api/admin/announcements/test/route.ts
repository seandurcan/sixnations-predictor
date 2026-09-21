import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendAnnouncementTest } from "@/lib/email/announcements";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  const body = await request.json().catch(() => ({}));
  const campaignId = Number(body.campaignId);
  if (!adminUserId || !Number.isInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a saved draft announcement." },
      { status: 400 }
    );
  }

  try {
    const result = await sendAnnouncementTest(campaignId, adminUserId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the test email.";
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}
