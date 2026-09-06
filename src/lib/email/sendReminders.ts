import crypto from "crypto";
import { resend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import {
  buildPredictionReminderEmail,
  buildVerificationReminderEmail,
} from "@/lib/email/reminderTemplates";
import {
  recordPredictionReminder,
  recordVerificationReminder,
} from "@/lib/reminders/reminderService";

const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://perfect-xv.org"
).replace(/\/+$/, "");

const FROM_ADDRESS = "Perfect XV <noreply@perfect-xv.org>";

async function sendOrThrow(message: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    ...message,
  });

  if (error) {
    throw new Error(error.message || "Resend rejected the email.");
  }
}

export async function sendVerificationReminder(
  user: {
    id: number;
    firstName: string;
    email: string;
  },
  finalReminder = false
) {
  const token = crypto.randomUUID() + crypto.randomUUID();

  try {
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const email = buildVerificationReminderEmail(
      user.firstName,
      `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`,
      finalReminder
    );

    await sendOrThrow({
      to: user.email,
      subject: email.subject,
      text: email.text,
    });

    await recordVerificationReminder(user.id);
  } catch (error) {
    await prisma.emailVerification
      .delete({ where: { token } })
      .catch(() => undefined);
    throw error;
  }
}

export async function sendPredictionReminder(
  user: {
    id: number;
    firstName: string;
    email: string;
  },
  finalReminder = false
) {
  const email = buildPredictionReminderEmail(
    user.firstName,
    APP_URL,
    finalReminder
  );

  await sendOrThrow({
    to: user.email,
    subject: email.subject,
    text: email.text,
  });

  await recordPredictionReminder(user.id);
}
