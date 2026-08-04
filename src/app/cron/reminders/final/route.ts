import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUsersNeedingPredictionReminder,
} from "@/lib/reminders/reminderService";
import {
  sendPredictionReminder,
  sendVerificationReminder,
} from "@/lib/email/sendReminders";

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

    const alreadyRunToday =
      await prisma.systemSetting.findUnique({
        where: {
          key: "lastFinalReminderRun",
        },
      });

    const today =
      new Date().toISOString().split("T")[0];

    if (
      alreadyRunToday?.value === today
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          "Final reminder already sent today",
      });
    }

    const nextMatch =
      await prisma.match.findFirst({
        where: {
          completed: false,
        },
        orderBy: {
          kickoffTime: "asc",
        },
      });

    if (!nextMatch) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          "No upcoming fixtures",
      });
    }

    const now = new Date();

    const isFirstFixtureDay =
      now.toDateString() ===
      nextMatch.kickoffTime.toDateString();

    const isNineAM =
      now.getHours() === 9;

    if (
      !isFirstFixtureDay ||
      !isNineAM
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          "Not final reminder time",
      });
    }

    const unverifiedUsers =
      await prisma.user.findMany({
        where: {
          emailVerified: false,
        },
        select: {
          id: true,
          firstName: true,
          email: true,
        },
      });

    let verificationSent = 0;

    for (const user of unverifiedUsers) {
      await sendVerificationReminder(
        {
          id: user.id,
          firstName:
            user.firstName,
          email: user.email,
        },
        true
      );

      verificationSent++;
    }

    const predictionUsers =
      await getUsersNeedingPredictionReminder();

    let predictionSent = 0;

    for (const user of predictionUsers) {
      await sendPredictionReminder(
        {
          id: user.id,
          firstName:
            user.firstName,
          email: user.email,
        },
        true
      );

      predictionSent++;
    }

    const runTimestamp =
      new Date().toISOString();

    await prisma.systemSetting.upsert({
      where: {
        key: "lastReminderRun",
      },
      update: {
        value: runTimestamp,
      },
      create: {
        key: "lastReminderRun",
        value: runTimestamp,
      },
    });

    await prisma.systemSetting.upsert({
      where: {
        key: "lastFinalReminderRun",
      },
      update: {
        value: today,
      },
      create: {
        key: "lastFinalReminderRun",
        value: today,
      },
    });

    return NextResponse.json({
      success: true,
      verificationSent,
      predictionSent,
      finalReminderRun: true,
      runTimestamp,
    });
  } catch (error) {
    console.error(
      "Final reminder job failed",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Final reminder job failed",
      },
      {
        status: 500,
      }
    );
  }
}