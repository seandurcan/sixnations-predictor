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
  scheduledAt?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    ...message,
  });

  if (error) {
    throw new Error(error.message || "Resend rejected the email.");
  }

  return data;
}

export async function sendVerificationReminder(
  user: {
    id: number;
    firstName: string;
    email: string;
  },
  finalReminder = false,
  timeRemaining?: string,
  scheduledAt?: Date
) {
  const token = crypto.randomUUID() + crypto.randomUUID();

  try {
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(
          (scheduledAt?.getTime() ?? Date.now()) + 60 * 60 * 1000
        ),
      },
    });

    const email = buildVerificationReminderEmail(
      user.firstName,
      `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`,
      finalReminder,
      timeRemaining
    );

    const data = await sendOrThrow({
      to: user.email,
      subject: email.subject,
      text: email.text,
      scheduledAt: scheduledAt?.toISOString(),
    });

    await recordVerificationReminder(user.id);
    return { emailId: data?.id ?? null };
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
  finalReminder = false,
  timeRemaining?: string,
  scheduledAt?: Date
) {
  const email = buildPredictionReminderEmail(
    user.firstName,
    APP_URL,
    finalReminder,
    timeRemaining
  );

  const data = await sendOrThrow({
    to: user.email,
    subject: email.subject,
    text: email.text,
    scheduledAt: scheduledAt?.toISOString(),
  });

  await recordPredictionReminder(user.id);
  return { emailId: data?.id ?? null };
}
