import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendEmailVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function PATCH(
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

  const body = await request.json().catch(() => null) as {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    mobile?: unknown;
    confirmationEmail?: unknown;
  } | null;
  if (!body || typeof body.firstName !== "string" || typeof body.lastName !== "string"
    || typeof body.email !== "string" || typeof body.mobile !== "string") {
    return NextResponse.json({ success: false, error: "Enter valid account details." }, { status: 400 });
  }

  const firstName = body.firstName.trim();
  const lastName = body.lastName.trim();
  const email = body.email.trim().toLowerCase();
  const mobile = body.mobile.trim();
  if (!firstName || firstName.length > 60) {
    return NextResponse.json({ success: false, error: "First name is required and must be 60 characters or fewer." }, { status: 400 });
  }
  if (!lastName || lastName.length > 80) {
    return NextResponse.json({ success: false, error: "Surname is required and must be 80 characters or fewer." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (mobile.length > 30) {
    return NextResponse.json({ success: false, error: "Mobile number must be 30 characters or fewer." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true, mobile: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "The user account was not found." }, { status: 404 });
  }

  const emailChanged = email !== user.email.trim().toLowerCase();
  const changedFields = [
    ...(firstName !== user.firstName ? ["first name"] : []),
    ...(lastName !== user.lastName ? ["surname"] : []),
    ...(mobile !== user.mobile ? ["mobile"] : []),
    ...(emailChanged ? ["email"] : []),
  ];
  if (changedFields.length === 0) {
    return NextResponse.json({ success: false, error: "No account details were changed." }, { status: 409 });
  }

  if (emailChanged) {
    const confirmationEmail = typeof body.confirmationEmail === "string"
      ? body.confirmationEmail.trim().toLowerCase()
      : "";
    if (confirmationEmail !== user.email.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Enter the current account email address exactly to confirm the email change." },
        { status: 400 }
      );
    }
    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        email: { equals: email, mode: "insensitive" },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ success: false, error: "That email address is already used by another account." }, { status: 409 });
    }
  }

  const token = emailChanged ? crypto.randomUUID() + crypto.randomUUID() : null;
  const targetEmailHash = emailHash(user.email);
  try {
    await prisma.$transaction(async (tx) => {
      if (emailChanged) {
        await tx.passwordReset.deleteMany({ where: { userId } });
        await tx.emailVerification.deleteMany({ where: { userId } });
        await tx.emailPreferenceToken.deleteMany({ where: { userId } });
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          email,
          mobile,
          ...(emailChanged ? { emailVerified: false, lastVerificationReminderAt: null } : {}),
        },
      });
      if (token) {
        await tx.emailVerification.create({
          data: { userId, token, expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS) },
        });
      }
      await tx.adminUserActionAudit.create({
        data: {
          adminUserId,
          targetUserId: userId,
          targetEmailHash,
          action: "CORRECT_ACCOUNT",
          status: "SUCCEEDED",
          detail: `Corrected fields: ${changedFields.join(", ")}.`,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ success: false, error: "That email address is already used by another account." }, { status: 409 });
    }
    console.error("Admin account correction failed", error);
    return NextResponse.json({ success: false, error: "The account correction could not be saved." }, { status: 500 });
  }

  let warning: string | undefined;
  if (token) {
    try {
      await sendEmailVerificationEmail(email, token);
    } catch (error) {
      console.error("Corrected-address verification email failed", error);
      await prisma.emailVerification.delete({ where: { token } }).catch(() => undefined);
      warning = "The account was corrected, but the verification email could not be sent. Use Resend Verification to try again.";
    }
  }

  return NextResponse.json({
    success: true,
    message: warning ?? (emailChanged
      ? "Account details corrected. A verification email was sent to the new address."
      : "Account details corrected."),
    warning,
    user: { id: userId, firstName, lastName, email, mobile, emailVerified: emailChanged ? false : undefined },
  });
}

export async function DELETE(
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

  const body = await request.json().catch(() => null) as { confirmationEmail?: unknown } | null;
  const confirmationEmail = typeof body?.confirmationEmail === "string"
    ? body.confirmationEmail.trim().toLowerCase()
    : "";

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "The user account was not found." }, { status: 404 });
  }
  if (user.role === "ADMIN" || user.id === adminUserId) {
    return NextResponse.json(
      { success: false, error: "Administrator accounts cannot be deleted from User Manager." },
      { status: 409 }
    );
  }
  if (confirmationEmail !== user.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Enter the account email address exactly to confirm deletion." },
      { status: 400 }
    );
  }

  const deletedAt = new Date();
  const anonymousEmail = `deleted-${user.id}-${crypto.randomUUID()}@accounts.invalid`;
  const anonymousPassword = crypto.randomUUID() + crypto.randomUUID();
  const targetEmailHash = emailHash(user.email);

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } });
    await tx.passwordReset.deleteMany({ where: { userId } });
    await tx.emailVerification.deleteMany({ where: { userId } });
    await tx.emailPreferenceToken.deleteMany({ where: { userId } });
    await tx.announcementDelivery.updateMany({
      where: { recipientUserId: userId },
      data: {
        recipientUserId: null,
        recipientEmail: anonymousEmail,
        unsubscribeToken: null,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        firstName: "Former",
        lastName: "Participant",
        email: anonymousEmail,
        mobile: "",
        passwordHash: anonymousPassword,
        role: "USER",
        emailVerified: false,
        announcementOptOutAt: deletedAt,
        lastVerificationReminderAt: null,
        lastPredictionReminderAt: null,
        deletedAt,
      },
    });
    await tx.adminUserActionAudit.create({
      data: {
        adminUserId,
        targetUserId: userId,
        targetEmailHash,
        action: "DELETE_ACCOUNT",
        status: "SUCCEEDED",
        detail: "Identity anonymised; anonymous competition history retained.",
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: "The account was deleted and its competition history was anonymised.",
  });
}
