import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createEmailPreferenceToken } from "@/lib/email/announcements";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { buildTestingEmail, TEST_SITE } from "@/lib/testingCampaignEmail";

export const runtime = "nodejs";
export const maxDuration = 300;


type ImportUser = {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role?: "USER" | "ADMIN";
  registrationOrder?: number;
  announcementOptOutAt?: string | null;
};

function isProtectedAlias(email: string) {
  return /^seandurcan\+[^@]+@gmail\.com$/i.test(email.trim());
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  if (
    process.env.VERCEL_PROJECT_ID !== "prj_bw5EAJac45HfO2utXKKvENAKhBfE" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "staging"
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const totalActive = await prisma.user.count({
    where: { deletedAt: null },
  });

  const protectedAliases = await prisma.user.count({
    where: {
      deletedAt: null,
      email: {
        startsWith: "seandurcan+",
        mode: "insensitive",
      },
    },
  });

  const ordinaryActive = totalActive - protectedAliases;

  const unverifiedOrdinary = await prisma.user.count({
    where: {
      deletedAt: null,
      emailVerified: false,
      NOT: {
        email: {
          startsWith: "seandurcan+",
          mode: "insensitive",
        },
      },
    },
  });

  const migrationWindow = {
    gte: new Date("2026-09-28T20:14:00.000Z"),
    lte: new Date("2026-09-28T20:19:00.000Z"),
  };

  const migrationEmailAttempts = await prisma.emailPreferenceToken.count({
    where: { createdAt: migrationWindow },
  });

  const migrationTokenUsers = await prisma.emailPreferenceToken.findMany({
    where: { createdAt: migrationWindow },
    distinct: ["userId"],
    select: { userId: true },
  });

  const ordinaryCreatedBeforeMigration = await prisma.user.count({
    where: {
      deletedAt: null,
      createdAt: { lt: migrationWindow.gte },
      NOT: {
        email: {
          startsWith: "seandurcan+",
          mode: "insensitive",
        },
      },
    },
  });

  const ordinaryCreatedDuringMigration = await prisma.user.count({
    where: {
      deletedAt: null,
      createdAt: migrationWindow,
      NOT: {
        email: {
          startsWith: "seandurcan+",
          mode: "insensitive",
        },
      },
    },
  });

  const ordinaryUpdatedDuringMigration = await prisma.user.count({
    where: {
      deletedAt: null,
      updatedAt: migrationWindow,
      NOT: {
        email: {
          startsWith: "seandurcan+",
          mode: "insensitive",
        },
      },
    },
  });

  return NextResponse.json({
    totalActive,
    protectedAliases,
    ordinaryActive,
    unverifiedOrdinary,
    migrationEmailAttempts,
    migrationTokenUsers: migrationTokenUsers.length,
    ordinaryCreatedBeforeMigration,
    ordinaryCreatedDuringMigration,
    ordinaryUpdatedDuringMigration,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null) as { users?: ImportUser[] } | null;
  if (!body || !Array.isArray(body.users) || body.users.length === 0) {
    return NextResponse.json({ success: false, error: "No users supplied." }, { status: 400 });
  }
  if (body.users.length > 250) {
    return NextResponse.json({ success: false, error: "Import is limited to 250 users." }, { status: 400 });
  }

  const preExisting = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { email: true },
  });
  const alreadyEmailed = new Set(
    preExisting
      .map((user) => user.email.trim().toLowerCase())
      .filter((email) => !isProtectedAlias(email))
  );

  let created = 0;
  let updated = 0;
  let sent = 0;
  let skippedAlreadyEmailed = 0;
  let skippedProtected = 0;
  let failedEmails = 0;
  const failures: string[] = [];

  for (const raw of body.users) {
    const firstName = cleanText(raw.firstName, 100);
    const lastName = cleanText(raw.lastName, 100);
    const email = cleanText(raw.email, 320).toLowerCase();
    const mobile = cleanText(raw.mobile ?? "", 80);
    const role = raw.role === "ADMIN" ? "ADMIN" : "USER";
    const registrationOrder = Number.isInteger(raw.registrationOrder)
      ? Number(raw.registrationOrder)
      : 999999;

    if (!firstName || !lastName || !email.includes("@")) {
      failures.push(email || "(missing email)");
      continue;
    }
    if (isProtectedAlias(email)) {
      skippedProtected++;
      continue;
    }

    const passwordHash = await bcrypt.hash(
      crypto.randomUUID() + crypto.randomUUID(),
      12
    );

    const existing = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });

    let userId: number;
    if (existing) {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName,
          lastName,
          email,
          mobile,
          role,
          registrationOrder,
          passwordHash,
          emailVerified: false,
          lastVerificationReminderAt: null,
          announcementOptOutAt: raw.announcementOptOutAt
            ? new Date(raw.announcementOptOutAt)
            : null,
        },
        select: { id: true },
      });
      userId = user.id;
      updated++;
    } else {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          mobile,
          role,
          registrationOrder,
          passwordHash,
          emailVerified: false,
          announcementOptOutAt: raw.announcementOptOutAt
            ? new Date(raw.announcementOptOutAt)
            : null,
        },
        select: { id: true },
      });
      userId = user.id;
      created++;
    }

    await prisma.emailVerification.deleteMany({ where: { userId } });
    await prisma.passwordReset.deleteMany({
      where: { userId, used: false },
    });

    if (alreadyEmailed.has(email)) {
      skippedAlreadyEmailed++;
      continue;
    }

    try {
      const token = await createEmailPreferenceToken(userId, false, 30);
      const unsubscribeUrl =
        `${TEST_SITE}/api/email-preferences/unsubscribe?token=${encodeURIComponent(token)}`;
      const message = buildTestingEmail(firstName, unsubscribeUrl);
      const { error } = await resend.emails.send({
        from: "Perfect XV <noreply@perfect-xv.org>",
        to: email,
        replyTo: "administrator@perfect-xv.org",
        subject: "Could you help me test Perfect XV?",
        html: message.html,
        text: message.text,
      });
      if (error) throw new Error(error.message || "Email provider rejected the message.");
      sent++;
      await new Promise((resolve) => setTimeout(resolve, 550));
    } catch {
      failedEmails++;
      failures.push(email);
    }
  }

  const totalActive = await prisma.user.count({ where: { deletedAt: null } });
  const ordinaryActive = await prisma.user.count({
    where: {
      deletedAt: null,
      NOT: {
        email: {
          startsWith: "seandurcan+",
          mode: "insensitive",
        },
      },
    },
  });

  return NextResponse.json({
    success: failures.length === 0,
    supplied: body.users.length,
    created,
    updated,
    sent,
    skippedAlreadyEmailed,
    skippedProtected,
    failedEmails,
    failures,
    totalActive,
    ordinaryActive,
  });
}
