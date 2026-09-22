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

    const reminderAt = new Date(
      tournament.predictionLockAt.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    if (now < reminderAt || now >= tournament.predictionLockAt) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Not the one-week lockdown reminder window",
        reminderAt: reminderAt.toISOString(),
        predictionLockAt: tournament.predictionLockAt.toISOString(),
      });
    }

    const alreadyRun = await prisma.systemSetting.findUnique({
      where: { key: "lastOneWeekPredictionReminderRun" },
    });
    const runKey = String(tournament.id);
    if (alreadyRun?.value === runKey) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "One-week reminder already sent for this tournament",
      });
    }

    let verificationSent = 0;
    let predictionSent = 0;
    let verificationFailed = 0;
    let predictionFailed = 0;

    const {
      getUsersWithOutstandingPredictions,
    } = await import(
      "@/lib/reminders/reminderService"
    );

    const {
      sendPredictionReminder,
      sendVerificationReminder,
    } = await import(
      "@/lib/email/sendReminders"
    );

    const verificationUsers = await prisma.user.findMany({
      where: { emailVerified: false, deletedAt: null },
      select: { id: true, firstName: true, email: true },
    });

    for (const user of verificationUsers) {
      try {
        await sendVerificationReminder(
          {
            id: user.id,
            firstName:
              user.firstName,
            email: user.email,
          },
          false,
          "One week"
        );
        verificationSent++;
      } catch (error) {
        verificationFailed++;
        console.error("Scheduled verification reminder failed", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const predictionUsers =
      await getUsersWithOutstandingPredictions(tournament.id);

    for (const user of predictionUsers) {
      try {
        await sendPredictionReminder(
          {
            id: user.id,
            firstName:
              user.firstName,
            email: user.email,
          },
          false,
          "One week"
        );
        predictionSent++;
      } catch (error) {
        predictionFailed++;
        console.error("Scheduled prediction reminder failed", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
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

    await prisma.systemSetting.upsert({
      where: { key: "lastOneWeekPredictionReminderRun" },
      update: { value: runKey },
      create: { key: "lastOneWeekPredictionReminderRun", value: runKey },
    });

    return NextResponse.json({
      success: true,
      verificationSent,
      verificationFailed,
      predictionSent,
      predictionFailed,
      reminderAt: reminderAt.toISOString(),
      predictionLockAt: tournament.predictionLockAt.toISOString(),
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
