import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ success: false, error: "Invalid unsubscribe link." }, { status: 400 });
  }

  const invitation = await prisma.perfectXvInvitation.findUnique({
    where: { unsubscribeTokenHash: tokenHash(token) },
    select: { firstName: true, unsubscribedAt: true },
  });

  if (!invitation) {
    return NextResponse.json({ success: false, error: "This unsubscribe link is not valid." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    firstName: invitation.firstName,
    unsubscribed: Boolean(invitation.unsubscribedAt),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ success: false, error: "Invalid unsubscribe link." }, { status: 400 });
  }

  const invitation = await prisma.perfectXvInvitation.findUnique({
    where: { unsubscribeTokenHash: tokenHash(token) },
    select: { id: true, unsubscribedAt: true },
  });

  if (!invitation) {
    return NextResponse.json({ success: false, error: "This unsubscribe link is not valid." }, { status: 404 });
  }

  if (!invitation.unsubscribedAt) {
    await prisma.perfectXvInvitation.update({
      where: { id: invitation.id },
      data: { unsubscribedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, unsubscribed: true });
}
