import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUsersWithOutstandingPredictions,
  hasScheduledFinalReminder,
  recordScheduledFinalReminder,
} from "@/lib/reminders/reminderService";
import {
  sendPredictionReminder,
  sendVerificationReminder,
} from "@/lib/email/sendReminders";
import {
  finalReminderAt,
  shouldScheduleFinalReminder,
} from "@/lib/reminders/schedule";

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
    const lookAhead = new Date(
      now.getTime() + 30 * 60 * 60 * 1000
    );

    const tournaments = await prisma.tournament.findMany({
      where: {
        status: "OPEN",
        firstKickoff: {
          gt: now,
          lte: lookAhead,
        },
      },
      orderBy: { firstKickoff: "asc" },
    });

    const results: Array<Record<string, unknown>> = [];

    for (const tournament of tournaments) {
      if (
        !tournament.firstKickoff ||
        !shouldScheduleFinalReminder(
          tournament.firstKickoff,
          now
        )
      ) {
        continue;
      }

      const scheduledAt = finalReminderAt(
        tournament.firstKickoff
      );

      const unverifiedUsers = await prisma.user.findMany({
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

      let verificationScheduled = 0;
      let verificationFailed = 0;

      for (const user of unverifiedUsers) {
        const exists = await hasScheduledFinalReminder({
          kind: "VERIFICATION",
          userId: user.id,
          tournamentId: tournament.id,
        });
        if (exists) continue;

        try {
          const sent = await sendVerificationReminder(
            user,
            true,
            "Two hours",
            scheduledAt
          );
          if (!sent.emailId) {
            throw new Error("Email provider did not return a scheduled email id.");
          }

          await recordScheduledFinalReminder({
            kind: "VERIFICATION",
            userId: user.id,
            tournamentId: tournament.id,
            emailId: sent.emailId,
            scheduledAt,
          });
          verificationScheduled++;
        } catch (error) {
          verificationFailed++;
          console.error("Final verification reminder scheduling failed", {
            tournamentId: tournament.id,
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const predictionUsers =
        await getUsersWithOutstandingPredictions(tournament.id);

      let predictionScheduled = 0;
      let predictionFailed = 0;

      for (const user of predictionUsers) {
        const exists = await hasScheduledFinalReminder({
          kind: "PREDICTION",
          userId: user.id,
          tournamentId: tournament.id,
        });
        if (exists) continue;

        try {
          const sent = await sendPredictionReminder(
            user,
            true,
            "Two hours",
            scheduledAt
          );
          if (!sent.emailId) {
            throw new Error("Email provider did not return a scheduled email id.");
          }

          await recordScheduledFinalReminder({
            kind: "PREDICTION",
            userId: user.id,
            tournamentId: tournament.id,
            emailId: sent.emailId,
            scheduledAt,
          });
          predictionScheduled++;
        } catch (error) {
          predictionFailed++;
          console.error("Final prediction reminder scheduling failed", {
            tournamentId: tournament.id,
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      results.push({
        tournamentId: tournament.id,
        firstKickoff: tournament.firstKickoff.toISOString(),
        scheduledAt: scheduledAt.toISOString(),
        verificationScheduled,
        verificationFailed,
        predictionScheduled,
        predictionFailed,
      });
    }

    if (results.length > 0) {
      const runTimestamp = new Date().toISOString();
      await prisma.systemSetting.upsert({
        where: { key: "lastReminderRun" },
        update: { value: runTimestamp },
        create: { key: "lastReminderRun", value: runTimestamp },
      });
      await prisma.systemSetting.upsert({
        where: { key: "lastFinalReminderSchedulerRun" },
        update: { value: runTimestamp },
        create: { key: "lastFinalReminderSchedulerRun", value: runTimestamp },
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Final reminder scheduler failed", error);
    return NextResponse.json(
      { success: false, error: "Final reminder scheduler failed" },
      { status: 500 }
    );
  }
}
