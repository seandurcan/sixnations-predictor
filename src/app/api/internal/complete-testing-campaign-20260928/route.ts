import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { buildTestingEmail, TEST_SITE } from "@/lib/testingCampaignEmail";

export const runtime = "nodejs";
export const maxDuration = 300;

const PROJECT_ID = "prj_bw5EAJac45HfO2utXKKvENAKhBfE";
const INITIAL_START = new Date("2026-09-28T18:07:00.000Z");
const INITIAL_END = new Date("2026-09-28T18:10:00.000Z");
const MIGRATION_START = new Date("2026-09-28T20:14:00.000Z");
const MIGRATION_END = new Date("2026-09-28T20:19:00.000Z");
const SENT_PREFIX = "TESTING_CAMPAIGN_COMPLETION_SENT_";

function isProtectedAlias(email: string) {
  return /^seandurcan\+[^@]+@gmail\.com$/i.test(email.trim());
}

function markerKey(email: string) {
  return SENT_PREFIX + crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  if (
    process.env.VERCEL_PROJECT_ID !== PROJECT_ID ||
    process.env.VERCEL_GIT_COMMIT_REF !== "staging"
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, firstName: true, email: true },
    orderBy: { id: "asc" },
  });

  const ordinaryUsers = users.filter((user) => !isProtectedAlias(user.email));

  const priorTokens = await prisma.emailPreferenceToken.findMany({
    where: {
      OR: [
        { createdAt: { gte: INITIAL_START, lte: INITIAL_END } },
        { createdAt: { gte: MIGRATION_START, lte: MIGRATION_END } },
      ],
    },
    select: { userId: true },
  });

  const coveredIds = new Set(priorTokens.map((token) => token.userId));

  const completionMarkers = await prisma.systemSetting.findMany({
    where: { key: { startsWith: SENT_PREFIX } },
    select: { key: true },
  });
  const completedKeys = new Set(completionMarkers.map((item) => item.key));

  const pending = ordinaryUsers.filter(
    (user) => !coveredIds.has(user.id) && !completedKeys.has(markerKey(user.email))
  );

  let sent = 0;
  const failures: string[] = [];

  for (const user of pending) {
    const token = crypto.randomBytes(32).toString("hex");
    const preference = await prisma.emailPreferenceToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenHash(token),
        testOnly: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    const unsubscribeUrl =
      `${TEST_SITE}/api/email-preferences/unsubscribe?token=${encodeURIComponent(token)}`;
    const message = buildTestingEmail(user.firstName, unsubscribeUrl);

    try {
      const { error } = await resend.emails.send({
        from: "Perfect XV <noreply@perfect-xv.org>",
        to: user.email,
        replyTo: "administrator@perfect-xv.org",
        subject: "Could you help me test Perfect XV?",
        html: message.html,
        text: message.text,
      });

      if (error) {
        throw new Error(error.message || "Email provider rejected the message.");
      }

      await prisma.systemSetting.upsert({
        where: { key: markerKey(user.email) },
        update: { value: new Date().toISOString() },
        create: {
          key: markerKey(user.email),
          value: new Date().toISOString(),
        },
      });

      sent += 1;
      await new Promise((resolve) => setTimeout(resolve, 550));
    } catch {
      await prisma.emailPreferenceToken.delete({ where: { id: preference.id } }).catch(() => null);
      failures.push(user.email);
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    ordinaryUsers: ordinaryUsers.length,
    previouslyCovered: ordinaryUsers.length - pending.length,
    pendingBeforeRun: pending.length,
    sent,
    failed: failures.length,
    failures,
  });
}
