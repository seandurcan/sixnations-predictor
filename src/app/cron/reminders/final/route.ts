import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUsersWithOutstandingPredictions,
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
        status: "OPEN",
        predictionLockAt: { gt: now },
      },
      orderBy: { predictionLockAt: "asc" },
    });

    if (!tournament || !tournament.predictionLockAt) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "No upcoming open tournament",
      });
    }

    const finalReminderAt = new Date(
      tournament.predictionLockAt.getTime() - 60 * 60 * 1000
    );

    if (now < finalReminderAt || now >= tournament.predictionLockAt) {
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
    let verificationFailed = 0;

    for (const user of unverifiedUsers) {
      try {
        await sendVerificationReminder(
          {
            id: user.id,
            firstName:
              user.firstName,
            email: user.email,
          },
          true,
          "One hour"
        );
        verificationSent++;
      } catch (error) {
        verificationFailed++;
        console.error("Final verification reminder failed", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const predictionUsers =
      await getUsersWithOutstandingPredictions(tournament.id);

    let predictionSent = 0;
    let predictionFailed = 0;

    for (const user of predictionUsers) {
      try {
        await sendPredictionReminder(
          {
            id: user.id,
            firstName:
              user.firstName,
            email: user.email,
          },
          true,
          "One hour"
        );
        predictionSent++;
      } catch (error) {
        predictionFailed++;
        console.error("Final prediction reminder failed", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
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
      verificationFailed,
      predictionSent,
      predictionFailed,
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
