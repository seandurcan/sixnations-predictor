import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getUsersNeedingPredictionReminder,
  getUsersNeedingVerificationReminder,
} from "@/lib/reminders/reminderService";

export async function GET() {
  try {
    await requireAdmin();

    const verificationUsers =
      await getUsersNeedingVerificationReminder();

    const predictionUsers =
      await getUsersNeedingPredictionReminder();

    return NextResponse.json({
      success: true,
      verificationRemindersDue:
        verificationUsers.length,
      predictionRemindersDue:
        predictionUsers.length,
    });
  } catch (error) {
    console.error(
      "Failed to load reminder counts:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load reminder counts.",
      },
      {
        status: 500,
      }
    );
  }
}