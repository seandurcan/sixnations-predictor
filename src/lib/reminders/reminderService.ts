import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildVerificationReminderEmail,
  buildPredictionReminderEmail,
} from "@/lib/email/reminderTemplates";

export async function processReminders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let verificationSentCount = 0;
  let predictionSentCount = 0;

  // 1. Process Verification Reminders
  const unverifiedUsers = await prisma.user.findMany({
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

      await prisma.user.update({
        where: { id: user.id },
        data: { lastVerificationReminderAt: new Date() },
      });

      verificationSentCount++;
    } catch (err) {
      console.error(`Failed to send verification reminder to ${user.email}:`, err);
    }
  }

  // 2. Process Prediction Reminders
  const activeTournament = await prisma.tournament.findFirst({
    where: { status: { in: ["OPEN", "LOCKED"] } },
    include: { matches: true },
  });

  if (activeTournament) {
    const totalFixtures = activeTournament.matches.length;

    const verifiedUsers = await prisma.user.findMany({
      where: { emailVerified: true },
      include: { predictions: true },
    });

    for (const user of verifiedUsers) {
      if (user.predictions.length < totalFixtures) {
        if (
          !user.lastPredictionReminderAt ||
          user.lastPredictionReminderAt <= sevenDaysAgo
        ) {
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

            await prisma.user.update({
              where: { id: user.id },
              data: { lastPredictionReminderAt: new Date() },
            });

            predictionSentCount++;
          } catch (err) {
            console.error(
              `Failed to send prediction reminder to ${user.email}:`,
              err
            );
          }
        }
      }
    }
  }

  return {
    verificationSentCount,
    predictionSentCount,
  };
}