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

    const now = new Date();
    const tournament = await prisma.tournament.findFirst({
      where: {
        status: { in: ["OPEN", "LOCKED"] },
        firstKickoff: { gt: now },
      },
      orderBy: { firstKickoff: "asc" },
    });

    if (!tournament) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "No upcoming open tournament",
      });
    }

    const finalReminderAt = new Date(
      tournament.firstKickoff.getTime() - 2 * 60 * 60 * 1000
    );

    if (now < finalReminderAt || now >= tournament.firstKickoff) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Not final reminder time",
        finalReminderAt: finalReminderAt.toISOString(),
      });
    }

    const alreadyRun = await prisma.systemSetting.findUnique({
      where: { key: "lastFinalReminderRun" },
    });

    const runKey = String(tournament.id);
    if (alreadyRun?.value === runKey) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Final reminder already sent for this tournament",
      });
    }

    const unverifiedUsers =
      await prisma.user.findMany({
        where: {
          emailVerified: false,
          deletedAt: null,
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
        value: runKey,
      },
      create: {
        key: "lastFinalReminderRun",
        value: runKey,
      },
    });

    return NextResponse.json({
      success: true,
      verificationSent,
      predictionSent,
      finalReminderRun: true,
      runTimestamp,
      finalReminderAt: finalReminderAt.toISOString(),
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
