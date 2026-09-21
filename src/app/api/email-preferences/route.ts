import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }
  return NextResponse.json({
    success: true,
    announcementEmailsEnabled: !user.announcementOptOutAt,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }
  const body = await request.json().catch(() => ({}));
  if (typeof body.announcementEmailsEnabled !== "boolean") {
    return NextResponse.json(
      { success: false, error: "Select a valid email preference." },
      { status: 400 }
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      announcementOptOutAt: body.announcementEmailsEnabled ? null : new Date(),
    },
  });
  return NextResponse.json({
    success: true,
    announcementEmailsEnabled: body.announcementEmailsEnabled,
  });
}
