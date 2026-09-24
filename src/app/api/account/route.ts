import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendEmailVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function uniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }
  const podiumRecords = await prisma.tournamentWinner.findMany({
    where: { userId: user.id, rank: { lte: 3 } },
    orderBy: [{ createdAt: "desc" }, { rank: "asc" }],
  });
  const tournamentIds = Array.from(new Set(podiumRecords.map((record) => record.tournamentId)));
  const tournaments = tournamentIds.length > 0
    ? await prisma.tournament.findMany({
        where: { id: { in: tournamentIds } },
        select: { id: true, name: true, year: true, status: true },
      })
    : [];
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      emailVerified: user.emailVerified,
    },
    achievements: podiumRecords
      .map((record) => {
        const tournament = tournamentById.get(record.tournamentId);
        return tournament ? {
          id: record.id,
          tournamentId: record.tournamentId,
          tournamentName: tournament.name,
          tournamentYear: tournament.year,
          rank: record.rank,
          finalPoints: record.finalPoints,
          awardedAt: record.createdAt.toISOString(),
        } : null;
      })
      .filter(Boolean),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    mobile?: unknown;
    currentPassword?: unknown;
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

  const emailChanged = email !== user.email.trim().toLowerCase();
  const changed = firstName !== user.firstName || lastName !== user.lastName
    || mobile !== user.mobile || emailChanged;
  if (!changed) {
    return NextResponse.json({ success: false, error: "No account details were changed." }, { status: 409 });
  }
  if (emailChanged) {
    if (typeof body.currentPassword !== "string" || !body.currentPassword) {
      return NextResponse.json({ success: false, error: "Enter your current password to change your email address." }, { status: 400 });
    }
    const passwordMatches = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json({ success: false, error: "Your current password is incorrect." }, { status: 403 });
    }
    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: user.id },
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
  try {
    await prisma.$transaction(async (tx) => {
      if (emailChanged) {
        await tx.passwordReset.deleteMany({ where: { userId: user.id } });
        await tx.emailVerification.deleteMany({ where: { userId: user.id } });
        await tx.emailPreferenceToken.deleteMany({ where: { userId: user.id } });
      }
      await tx.user.update({
        where: { id: user.id },
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
          data: { userId: user.id, token, expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS) },
        });
      }
    });
  } catch (error) {
    if (uniqueConstraintError(error)) {
      return NextResponse.json({ success: false, error: "That email address is already used by another account." }, { status: 409 });
    }
    console.error("Self-service account update failed", error);
    return NextResponse.json({ success: false, error: "Your account details could not be saved." }, { status: 500 });
  }

  let warning: string | undefined;
  if (token) {
    try {
      await sendEmailVerificationEmail(email, token);
    } catch (error) {
      console.error("Self-service verification email failed", error);
      await prisma.emailVerification.delete({ where: { token } }).catch(() => undefined);
      warning = "Your details were saved, but the verification email could not be sent. Use Resend Verification on the login page to try again.";
    }
  }

  return NextResponse.json({
    success: true,
    message: warning ?? (emailChanged
      ? "Your account details were saved. Check the new address for a verification email."
      : "Your account details were saved."),
    warning,
    user: {
      id: user.id,
      firstName,
      lastName,
      email,
      mobile,
      emailVerified: emailChanged ? false : user.emailVerified,
    },
  });
}
