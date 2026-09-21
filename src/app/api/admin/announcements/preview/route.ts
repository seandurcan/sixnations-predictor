import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  buildAnnouncementEmail,
  prepareAnnouncementDraft,
} from "@/lib/email/announcements";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => ({}));
  const prepared = prepareAnnouncementDraft(body);
  if (!prepared.draft || prepared.errors.length > 0) {
    return NextResponse.json(
      { success: false, error: prepared.errors.join(" ") },
      { status: 400 }
    );
  }

  const email = buildAnnouncementEmail(prepared.draft, {
    unsubscribeUrl: "https://perfect-xv.org/email-preferences",
    testMode: true,
  });
  return NextResponse.json({
    success: true,
    subject: `[TEST] ${prepared.draft.subject}`,
    html: email.html,
    text: email.text,
  });
}
