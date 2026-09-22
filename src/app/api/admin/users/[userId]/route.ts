import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

function emailHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
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
