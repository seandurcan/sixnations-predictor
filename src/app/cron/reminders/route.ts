import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dueWeeklyReminder } from "@/lib/reminders/schedule";
import {
  getUsersWithOutstandingPredictions,
} from "@/lib/reminders/reminderService";
import {
  sendPredictionReminder,
  sendVerificationReminder,
} from "@/lib/email/sendReminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "automaticRemindersEnabled" },
    });
    if (setting?.value === "false") {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Automatic reminders disabled",
      });
    }

    const now = new Date();
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: "OPEN",
        firstKickoff: { gt: now },
      },
      orderBy: { firstKickoff: "asc" },
    });

    const results: Array<Record<string, unknown>> = [];

    for (const tournament of tournaments) {
      if (!tournament.firstKickoff) continue;

      const milestone = dueWeeklyReminder(
        tournament.firstKickoff,
        now
      );
      if (!milestone) continue;

      const runKey =
        `PREDICTION_REMINDER_${tournament.id}_${milestone.daysBefore}D`;
      const alreadyRun = await prisma.systemSetting.findUnique({
        where: { key: runKey },
      });
      if (alreadyRun) continue;

      let verificationSent = 0;
      let verificationFailed = 0;
      let predictionSent = 0;
      let predictionFailed = 0;

      const verificationUsers = await prisma.user.findMany({
        where: { emailVerified: false, deletedAt: null },
        select: { id: true, firstName: true, email: true },
      });

      for (const user of verificationUsers) {
        try {
          await sendVerificationReminder(
            user,
            false,
            milestone.label
          );
          verificationSent++;
        } catch (error) {
          verificationFailed++;
          console.error("Scheduled verification reminder failed", {
            tournamentId: tournament.id,
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
            user,
            false,
            milestone.label
          );
          predictionSent++;
        } catch (error) {
          predictionFailed++;
          console.error("Scheduled prediction reminder failed", {
            tournamentId: tournament.id,
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const runTimestamp = new Date().toISOString();
      await prisma.systemSetting.upsert({
        where: { key: runKey },
        update: { value: runTimestamp },
        create: { key: runKey, value: runTimestamp },
      });
      await prisma.systemSetting.upsert({
        where: { key: "lastReminderRun" },
        update: { value: runTimestamp },
        create: { key: "lastReminderRun", value: runTimestamp },
      });

      results.push({
        tournamentId: tournament.id,
        daysBefore: milestone.daysBefore,
        label: milestone.label,
        targetAt: milestone.targetAt.toISOString(),
        verificationSent,
        verificationFailed,
        predictionSent,
        predictionFailed,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Scheduled reminder job failed", error);
    return NextResponse.json(
      { success: false, error: "Scheduled reminder job failed" },
      { status: 500 }
    );
  }
}
