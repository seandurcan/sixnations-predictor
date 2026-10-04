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

export function isManualOverrideActive() {
  return Date.now() < MANUAL_OVERRIDE_UNTIL.getTime();
}

export const MANUAL_OVERRIDE_UNTIL_ISO = MANUAL_OVERRIDE_UNTIL.toISOString();

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

  return users.filter(
    (user) =>
      allowDailyOverride ||
      !user.lastVerificationReminderAt ||
      user.lastVerificationReminderAt <= sevenDaysAgo
  );
}

export async function getUsersNeedingPredictionReminder(
  allowDailyOverride = isManualOverrideActive()
) {
  if (allowDailyOverride) {
    return prisma.user.findMany({
      where: { emailVerified: true, deletedAt: null },
      include: { predictions: { select: { matchId: true } } },
    });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeTournament = await prisma.tournament.findFirst({
    where: { status: { in: ["OPEN", "LOCKED"] } },
    include: { matches: { select: { id: true } } },
    orderBy: { firstKickoff: "asc" },
  });

  if (!activeTournament || activeTournament.matches.length === 0) return [];

  const matchIds = activeTournament.matches.map((match) => match.id);
  const users = await prisma.user.findMany({
    where: {
      emailVerified: true,
      deletedAt: null,
      competitionEntries: { some: { tournamentId: activeTournament.id, status: "ENTERED" } },
    },
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
      (!user.lastPredictionReminderAt ||
        user.lastPredictionReminderAt <= sevenDaysAgo)
  );
}

export async function getUsersWithOutstandingPredictions(tournamentId: number) {
  const matches = await prisma.match.findMany({
    where: { tournamentId },
    select: { id: true },
  });
  if (matches.length === 0) return [];

  const matchIds = matches.map((match) => match.id);
  const users = await prisma.user.findMany({
    where: {
      emailVerified: true,
      deletedAt: null,
      competitionEntries: { some: { tournamentId, status: "ENTERED" } },
    },
    include: {
      predictions: {
        where: { matchId: { in: matchIds } },
        select: { matchId: true },
      },
    },
  });

  return users.filter((user) => user.predictions.length < matchIds.length);
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
        const verificationUrl =
          `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
        const { subject, text } = buildVerificationReminderEmail(
          user.firstName,
          verificationUrl,
          false
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
    manualOverrideUntil: MANUAL_OVERRIDE_UNTIL_ISO,
  };
}


export type ScheduledFinalReminderKind = "PREDICTION" | "VERIFICATION";

export const FINAL_REMINDER_EMAIL_PREFIX = "FINAL_REMINDER_EMAIL_";

export function finalReminderSettingKey(
  kind: ScheduledFinalReminderKind,
  userId: number,
  tournamentId: number
) {
  return `${FINAL_REMINDER_EMAIL_PREFIX}${kind}_${userId}_${tournamentId}`;
}

type ScheduledFinalReminderRecord = {
  emailId: string;
  scheduledAt: string;
};

function readScheduledReminder(value: string): ScheduledFinalReminderRecord | null {
  try {
    const parsed = JSON.parse(value) as Partial<ScheduledFinalReminderRecord>;
    if (
      typeof parsed.emailId === "string" &&
      parsed.emailId &&
      typeof parsed.scheduledAt === "string"
    ) {
      return {
        emailId: parsed.emailId,
        scheduledAt: parsed.scheduledAt,
      };
    }
  } catch {
    // Ignore malformed legacy settings.
  }
  return null;
}

export async function recordScheduledFinalReminder(input: {
  kind: ScheduledFinalReminderKind;
  userId: number;
  tournamentId: number;
  emailId: string;
  scheduledAt: Date;
}) {
  const key = finalReminderSettingKey(
    input.kind,
    input.userId,
    input.tournamentId
  );

  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value: JSON.stringify({
        emailId: input.emailId,
        scheduledAt: input.scheduledAt.toISOString(),
      }),
    },
    create: {
      key,
      value: JSON.stringify({
        emailId: input.emailId,
        scheduledAt: input.scheduledAt.toISOString(),
      }),
    },
  });
}

export async function hasScheduledFinalReminder(input: {
  kind: ScheduledFinalReminderKind;
  userId: number;
  tournamentId: number;
}) {
  const setting = await prisma.systemSetting.findUnique({
    where: {
      key: finalReminderSettingKey(
        input.kind,
        input.userId,
        input.tournamentId
      ),
    },
    select: { key: true },
  });
  return Boolean(setting);
}

async function cancelSetting(key: string, value: string) {
  const scheduled = readScheduledReminder(value);
  if (!scheduled || !process.env.RESEND_API_KEY) return false;

  try {
    await resend.emails.cancel(scheduled.emailId);
    await prisma.systemSetting.delete({ where: { key } }).catch(() => undefined);
    return true;
  } catch (error) {
    console.error("Unable to cancel scheduled final reminder", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function cancelScheduledFinalPredictionReminder(
  userId: number,
  tournamentId: number
) {
  const key = finalReminderSettingKey("PREDICTION", userId, tournamentId);
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
    select: { key: true, value: true },
  });
  if (!setting) return false;
  return cancelSetting(setting.key, setting.value);
}

export async function cancelScheduledFinalVerificationReminders(
  userId: number
) {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: `${FINAL_REMINDER_EMAIL_PREFIX}VERIFICATION_${userId}_`,
      },
    },
    select: { key: true, value: true },
  });

  const results = await Promise.all(
    settings.map((setting) => cancelSetting(setting.key, setting.value))
  );

  return results.filter(Boolean).length;
}
