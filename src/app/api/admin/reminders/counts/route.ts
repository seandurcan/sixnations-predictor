import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getUsersNeedingPredictionReminder,
  getUsersNeedingVerificationReminder,
} from "@/lib/reminders/reminderService";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
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
