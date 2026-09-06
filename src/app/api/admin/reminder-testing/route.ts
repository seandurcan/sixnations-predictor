import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  isManualOverrideActive,
  MANUAL_OVERRIDE_UNTIL_ISO,
} from "@/lib/reminders/reminderService";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
    },
  });

  return NextResponse.json({
    success: true,
    active: isManualOverrideActive(),
    expiresAt: MANUAL_OVERRIDE_UNTIL_ISO,
    users,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  if (!isManualOverrideActive()) {
    return NextResponse.json(
      { success: false, error: "The temporary testing window has ended." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const userId = Number(body.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid user." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId, deletedAt: null },
    data: {
      emailVerified: false,
      lastVerificationReminderAt: null,
    },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return NextResponse.json({
    success: true,
    message: `${user.firstName} ${user.lastName} is now unverified.`,
    user,
  });
}
