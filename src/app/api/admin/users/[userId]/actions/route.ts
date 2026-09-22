import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const EMAIL_RATE_LIMIT_MS = 5 * 60 * 1000;
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

type SupportAction = "RESEND_VERIFICATION" | "SEND_PASSWORD_RESET";

function emailHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

async function recordAudit(input: {
  adminUserId: number;
  targetUserId: number;
  targetEmail: string;
  action: SupportAction;
  status: "SUCCEEDED" | "FAILED";
  detail?: string;
}) {
  await prisma.adminUserActionAudit.create({
    data: {
      adminUserId: input.adminUserId,
      targetUserId: input.targetUserId,
      targetEmailHash: emailHash(input.targetEmail),
      action: input.action,
      status: input.status,
      detail: input.detail,
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) {
    return NextResponse.json({ success: false, error: "Administrator account unavailable." }, { status: 403 });
  }

  const userId = parseUserId((await context.params).userId);
  if (!userId) {
    return NextResponse.json({ success: false, error: "Invalid user account." }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  const action = body?.action;
  if (action !== "RESEND_VERIFICATION" && action !== "SEND_PASSWORD_RESET") {
    return NextResponse.json({ success: false, error: "Invalid support action." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "The user account was not found." }, { status: 404 });
  }

  const now = Date.now();

  if (action === "RESEND_VERIFICATION") {
    if (user.emailVerified) {
      return NextResponse.json({ success: false, error: "This account is already verified." }, { status: 409 });
    }

    const recentToken = await prisma.emailVerification.findFirst({
      where: {
        userId,
        verifiedAt: null,
        expiresAt: { gt: new Date(now + TOKEN_LIFETIME_MS - EMAIL_RATE_LIMIT_MS) },
      },
      select: { id: true },
    });
    if (recentToken) {
      return NextResponse.json(
        { success: false, error: "A verification email was sent recently. Please wait five minutes." },
        { status: 429 }
      );
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    await prisma.emailVerification.create({
      data: { userId, token, expiresAt: new Date(now + TOKEN_LIFETIME_MS) },
    });

    try {
      await sendEmailVerificationEmail(user.email, token);
    } catch (error) {
      await prisma.emailVerification.delete({ where: { token } }).catch(() => undefined);
      await recordAudit({
        adminUserId,
        targetUserId: userId,
        targetEmail: user.email,
        action,
        status: "FAILED",
        detail: error instanceof Error ? error.message.slice(0, 240) : "Email delivery failed",
      }).catch(() => undefined);
      console.error("Admin verification email failed", error);
      return NextResponse.json({ success: false, error: "The verification email could not be sent." }, { status: 502 });
    }

    await recordAudit({
      adminUserId,
      targetUserId: userId,
      targetEmail: user.email,
      action,
      status: "SUCCEEDED",
    }).catch((error) => console.error("Verification email audit failed", error));
    return NextResponse.json({ success: true, message: "Verification email sent." });
  }

  const recentReset = await prisma.passwordReset.findFirst({
    where: {
      userId,
      used: false,
      createdAt: { gt: new Date(now - EMAIL_RATE_LIMIT_MS) },
    },
    select: { id: true },
  });
  if (recentReset) {
    return NextResponse.json(
      { success: false, error: "A password-reset email was sent recently. Please wait five minutes." },
      { status: 429 }
    );
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  await prisma.passwordReset.create({
    data: { userId, token, expiresAt: new Date(now + TOKEN_LIFETIME_MS) },
  });

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (error) {
    await prisma.passwordReset.delete({ where: { token } }).catch(() => undefined);
    await recordAudit({
      adminUserId,
      targetUserId: userId,
      targetEmail: user.email,
      action,
      status: "FAILED",
      detail: error instanceof Error ? error.message.slice(0, 240) : "Email delivery failed",
    }).catch(() => undefined);
    console.error("Admin password-reset email failed", error);
    return NextResponse.json({ success: false, error: "The password-reset email could not be sent." }, { status: 502 });
  }


  await recordAudit({
    adminUserId,
    targetUserId: userId,
    targetEmail: user.email,
    action,
    status: "SUCCEEDED",
  }).catch((error) => console.error("Password-reset email audit failed", error));
  return NextResponse.json({ success: true, message: "Password-reset email sent." });
}
