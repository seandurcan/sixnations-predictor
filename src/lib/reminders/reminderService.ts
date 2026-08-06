import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildVerificationReminderEmail,
  buildPredictionReminderEmail,
} from "@/lib/email/reminderTemplates";

export async function recordVerificationReminder(userId: any) {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastVerificationReminderAt: new Date() },
  });
}

export async function recordPredictionReminder(userId: any) {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastPredictionReminderAt: new Date() },
  });
}

export async function getUsersNeedingVerificationReminder() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return await prisma.user.findMany({
    where: {
      emailVerified: false,
      createdAt: {
        lte: oneDayAgo,
      },
      OR: [
        { lastVerificationReminderAt: null },
        { lastVerificationReminderAt: { lte: sevenDaysAgo } },
      ],
    },
  });
}

export async function getUsersNeedingPredictionReminder() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeTournament = await prisma.tournament.findFirst({
    where: { status: { in: ["OPEN", "LOCKED"] } },
    include: { matches: true },
  });

  if (!activeTournament) return [];
  const totalFixtures = activeTournament.matches.length;

  const users = await prisma.user.findMany({
    where: { emailVerified: true },
    include: { predictions: true },
  });

  return users.filter(
    (user) =>
      user.predictions.length < totalFixtures &&
      (!user.lastPredictionReminderAt || user.lastPredictionReminderAt <= sevenDaysAgo)
  );
}

export async function processReminders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let verificationSentCount = 0;
  let predictionSentCount = 0;

  // 1. Process Verification Reminders
  const unverifiedUsers = await getUsersNeedingVerificationReminder();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const user of unverifiedUsers) {
    const isFinal = user.lastVerificationReminderAt !== null;
    const { subject, text } = buildVerificationReminderEmail(
      user.firstName,
      appUrl,
      isFinal
    );

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "Six Nations Predictor <noreply@resend.dev>",
          to: user.email,
          subject,
          text,
        });
      }

      await recordVerificationReminder(user.id);
      verificationSentCount++;
    } catch (err) {
      console.error(`Failed to send verification reminder to ${user.email}:`, err);
    }
  }

  // 2. Process Prediction Reminders
  const usersNeedingPrediction = await getUsersNeedingPredictionReminder();

  for (const user of usersNeedingPrediction) {
    const { subject, text } = buildPredictionReminderEmail(
      user.firstName,
      appUrl,
      false
    );

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "Six Nations Predictor <noreply@resend.dev>",
          to: user.email,
          subject,
          text,
        });
      }

      await recordPredictionReminder(user.id);
      predictionSentCount++;
    } catch (err) {
      console.error(
        `Failed to send prediction reminder to ${user.email}:`,
        err
      );
    }
  }

  return {
    verificationSentCount,
    predictionSentCount,
  };
}