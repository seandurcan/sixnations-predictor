import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization"
      );

    const cronSecret =
      process.env.CRON_SECRET;

    if (
      !cronSecret ||
      authHeader !==
        `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const setting =
      await prisma.systemSetting.findUnique({
        where: {
          key: "automaticRemindersEnabled",
        },
      });

    if (
      setting &&
      setting.value === "false"
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          "Automatic reminders disabled",
      });
    }

    const now = new Date();

    const isSaturday =
      now.getDay() === 6;

    const isNineAM =
      now.getHours() === 9;

    if (!isSaturday || !isNineAM) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          "Not scheduled reminder time",
      });
    }

    let verificationSent = 0;
    let predictionSent = 0;

    const {
      getUsersNeedingPredictionReminder,
      getUsersNeedingVerificationReminder,
    } = await import(
      "@/lib/reminders/reminderService"
    );

    const {
      sendPredictionReminder,
      sendVerificationReminder,
    } = await import(
      "@/lib/email/sendReminders"
    );

    const verificationUsers =
      await getUsersNeedingVerificationReminder();

    for (const user of verificationUsers) {
      await sendVerificationReminder(
        {
          id: user.id,
          firstName:
            user.firstName,
          email: user.email,
        }
      );

      verificationSent++;
    }

    const predictionUsers =
      await getUsersNeedingPredictionReminder();

    for (const user of predictionUsers) {
      await sendPredictionReminder(
        {
          id: user.id,
          firstName:
            user.firstName,
          email: user.email,
        }
      );

      predictionSent++;
    }

    await prisma.systemSetting.upsert({
      where: {
        key: "lastReminderRun",
      },
      update: {
        value: new Date().toISOString(),
      },
      create: {
        key: "lastReminderRun",
        value: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      verificationSent,
      predictionSent,
    });
  } catch (error) {
    console.error(
      "Scheduled reminder job failed",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Scheduled reminder job failed",
      },
      {
        status: 500,
      }
    );
  }
}