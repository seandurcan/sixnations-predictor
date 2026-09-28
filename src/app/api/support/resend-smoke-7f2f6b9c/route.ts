import { NextResponse } from "next/server";

import { sendHelpdeskEscalationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_GIT_COMMIT_REF !== "staging") {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  try {
    const result = await sendHelpdeskEscalationEmail({
      requesterEmail: "administrator@perfect-xv.org",
      ticketId: "STAGING-RESEND-SMOKE-TEST",
      question: "Staging Resend configuration test",
      chatbotAnswer: "This is a one-time staging email delivery test.",
    });

    return NextResponse.json({
      success: true,
      emailId: result?.id ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown email error.",
      },
      { status: 500 }
    );
  }
}
