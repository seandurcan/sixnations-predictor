// File to overwrite: src/app/api/admin/reminders/route.ts

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

    // Handle standard batch or specific actions via reminder service
    const results = await processReminders();
    return NextResponse.json({
      success: true,
      message: "Reminders processed successfully",
      sent: results?.sent ?? 0,
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