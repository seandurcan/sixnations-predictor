import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import {
  buildVerificationReminderEmail,
  buildPredictionReminderEmail,
} from "@/lib/email/reminderTemplates";

export type ReminderAction = "verification" | "prediction";

const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://perfect-xv.org"
)
  .trim()
  .replace(/\/+$/, "");

const FROM_ADDRESS = "Perfect XV <noreply@perfect-xv.org>";
const MANUAL_OVERRIDE_UNTIL = new Date("2026-09-07T08:00:00.000Z");

function isManualOverrideActive() {
  return Date.now() < MANUAL_OVERRIDE_UNTIL.getTime();
}

function isTodayInDublin(value: Date | null) {
  if (!value) return false;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(value) === formatter.format(new Date());
}

export async function recordVerificationReminder(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastVerificationReminderAt: new Date() },
  });
}

export async function recordPredictionReminder(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastPredictionReminderAt: new Date() },
  });
}

export async function getUsersNeedingVerificationReminder(
  allowDailyOverride = isManualOverrideActive()
) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      emailVerified: false,
      deletedAt: null,
      createdAt: { lte: oneDayAgo },
    },
  });

  return users.filter((user) =>
    allowDailyOverride
      ? !isTodayInDublin(user.lastVerificationReminderAt)
      : !user.lastVerificationReminderAt ||
        user.lastVerificationReminderAt <= sevenDaysAgo
  );
}

export async function getUsersNeedingPredictionReminder(
  allowDailyOverride = isManualOverrideActive()
) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeTournament = await prisma.tournament.findFirst({
    where: { status: { in: ["OPEN", "LOCKED"] } },
    include: { matches: { select: { id: true } } },
    orderBy: { firstKickoff: "asc" },
  });

  if (!activeTournament || activeTournament.matches.length === 0) return [];

  const matchIds = activeTournament.matches.map((match) => match.id);
  const users = await prisma.user.findMany({
    where: { emailVerified: true, deletedAt: null },
    include: {
      predictions: {
        where: { matchId: { in: matchIds } },
        select: { matchId: true },
      },
    },
  });

  return users.filter(
    (user) =>
      user.predictions.length < matchIds.length &&
      (allowDailyOverride
        ? !isTodayInDublin(user.lastPredictionReminderAt)
        : !user.lastPredictionReminderAt ||
          user.lastPredictionReminderAt <= sevenDaysAgo)
  );
}

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

export async function processReminders(action: ReminderAction) {
  let sentCount = 0;
  let failedCount = 0;

  if (action === "verification") {
    const users = await getUsersNeedingVerificationReminder();

    for (const user of users) {
      let token: string | null = null;

      try {
        token = crypto.randomUUID() + crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const isFinal = user.lastVerificationReminderAt !== null;
        const verificationUrl =
          `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
        const { subject, text } = buildVerificationReminderEmail(
          user.firstName,
          verificationUrl,
          isFinal
        );

        await prisma.emailVerification.create({
          data: { userId: user.id, token, expiresAt },
        });

        await sendOrThrow({ to: user.email, subject, text });
        token = null;

        await recordVerificationReminder(user.id);

        sentCount++;
      } catch (error) {
        if (token) {
          await prisma.emailVerification
            .delete({ where: { token } })
            .catch(() => undefined);
        }
        failedCount++;
        console.error("Verification reminder failed:", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } else {
    const users = await getUsersNeedingPredictionReminder();

    for (const user of users) {
      try {
        const { subject, text } = buildPredictionReminderEmail(
          user.firstName,
          APP_URL,
          false
        );

        await sendOrThrow({ to: user.email, subject, text });
        await recordPredictionReminder(user.id);
        sentCount++;
      } catch (error) {
        failedCount++;
        console.error("Prediction reminder failed:", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return {
    action,
    sentCount,
    failedCount,
    manualOverrideActive: isManualOverrideActive(),
    manualOverrideUntil: MANUAL_OVERRIDE_UNTIL.toISOString(),
  };
}
