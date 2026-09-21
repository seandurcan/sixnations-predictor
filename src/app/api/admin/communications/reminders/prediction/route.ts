import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { processReminders } from "@/lib/reminders/reminderService";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const results = await processReminders("prediction");
    return NextResponse.json({
      success: results.failedCount === 0,
      message: "Prediction reminder batch processed.",
      sent: results.sentCount,
      failed: results.failedCount,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Failed to send prediction reminders" }, { status: 500 });
  }
}
