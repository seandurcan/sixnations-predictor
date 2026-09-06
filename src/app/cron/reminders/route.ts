import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function nearestSaturdayOneMonthBefore(firstKickoff: Date) {
  const year = firstKickoff.getUTCFullYear();
  const month = firstKickoff.getUTCMonth() - 1;
  const day = firstKickoff.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const oneMonthBefore = new Date(
    Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth))
  );
  const dayOfWeek = oneMonthBefore.getUTCDay();
  const daysBack = (dayOfWeek + 1) % 7;
  const daysForward = (6 - dayOfWeek + 7) % 7;
  const offset = daysBack <= daysForward ? -daysBack : daysForward;

  oneMonthBefore.setUTCDate(oneMonthBefore.getUTCDate() + offset);
  return oneMonthBefore;
}

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

    const reminderStart = nearestSaturdayOneMonthBefore(tournament.firstKickoff);

    if (now < reminderStart || now >= tournament.firstKickoff) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Outside the tournament reminder window",
        reminderStart: reminderStart.toISOString(),
        firstKickoff: tournament.firstKickoff.toISOString(),
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
      reminderStart: reminderStart.toISOString(),
      firstKickoff: tournament.firstKickoff.toISOString(),
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
