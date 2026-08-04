FILE: src/lib/email/sendReminders.ts

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildPredictionReminderEmail,
  buildVerificationReminderEmail,
} from "@/lib/email/reminderTemplates";
import {
  recordPredictionReminder,
  recordVerificationReminder,
} from "@/lib/reminders/reminderService";

export async function sendVerificationReminder(
  user: {
    id: number;
    firstName: string;
    email: string;
  },
  finalReminder = false
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL!;

  const email =
    buildVerificationReminderEmail(
      user.firstName,
      appUrl,
      finalReminder
    );

  await resend.emails.send({
    from:
      "Six Nations Predictor <noreply@sixnationspredictor.com>",
    to: user.email,
    subject: email.subject,
    html: email.html,
  });

  await recordVerificationReminder(
    user.id
  );
}

export async function sendPredictionReminder(
  user: {
    id: number;
    firstName: string;
    email: string;
  },
  finalReminder = false
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL!;

  const totalFixtures =
    await prisma.match.count();

  const predictionCount =
    await prisma.prediction.count({
      where: {
        userId: user.id,
      },
    });

  const email =
    buildPredictionReminderEmail(
      user.firstName,
      predictionCount,
      totalFixtures,
      appUrl,
      finalReminder
    );

  await resend.emails.send({
    from:
      "Six Nations Predictor <noreply@sixnationspredictor.com>",
    to: user.email,
    subject: email.subject,
    html: email.html,
  });

  await recordPredictionReminder(
    user.id
  );
}