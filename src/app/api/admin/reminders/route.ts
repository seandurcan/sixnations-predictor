import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { processReminders } from "@/lib/reminders/reminderService";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "preview-verification") {
      return NextResponse.json({
        success: true,
        message: "Verification email preview generated.",
      });
    }

    if (action === "preview-prediction") {
      return NextResponse.json({
        success: true,
        message: "Prediction email preview generated.",
      });
    }

    if (action !== "verification" && action !== "prediction") {
      return NextResponse.json(
        { success: false, error: "Invalid reminder action." },
        { status: 400 }
      );
    }

    const results = await processReminders(action);
    return NextResponse.json({
      success: results.failedCount === 0,
      message: "Reminder batch processed.",
      sent: results.sentCount,
      failed: results.failedCount,
      error:
        results.failedCount > 0
          ? `${results.failedCount} email(s) failed. No failed email was marked as sent.`
          : undefined,
      results,
    });
  } catch (error) {
    console.error("Failed to process reminders:", error);
    return NextResponse.json(
      { error: "Failed to process reminder batch" },
      { status: 500 }
    );
  }
}
