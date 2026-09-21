import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { processReminders } from "@/lib/reminders/reminderService";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const results = await processReminders("verification");
    return NextResponse.json({
      success: results.failedCount === 0,
      message: "Verification reminder batch processed.",
      sent: results.sentCount,
      failed: results.failedCount,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Failed to send verification reminders" }, { status: 500 });
  }
}
