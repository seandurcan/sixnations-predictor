import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendPredictionConfirmation } from "@/lib/email/predictionConfirmations";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const tournament = await prisma.tournament.findFirst({
    where: { status: { in: ["OPEN", "LOCKED", "IN_PROGRESS", "COMPLETED"] } },
    orderBy: [{ firstKickoff: "desc" }, { id: "desc" }],
    select: { id: true, year: true, name: true, predictionLockAt: true },
  });
  if (!tournament) return NextResponse.json({ success: true, tournament: null, deliveries: [] });
  const deliveries = await prisma.predictionConfirmationDelivery.findMany({
    where: { tournamentId: tournament.id },
    orderBy: [{ status: "asc" }, { userId: "asc" }],
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, deletedAt: true } } },
  });
  return NextResponse.json({
    success: true,
    tournament,
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      user: delivery.user,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      lastAttemptAt: delivery.lastAttemptAt,
      sentAt: delivery.sentAt,
      errorMessage: delivery.errorMessage,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) return NextResponse.json({ success: false, error: "Administrator account unavailable." }, { status: 403 });
  const body = await request.json().catch(() => null) as { userId?: unknown; tournamentId?: unknown } | null;
  const userId = Number(body?.userId);
  const tournamentId = Number(body?.tournamentId);
  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ success: false, error: "Select a valid confirmation delivery." }, { status: 400 });
  }
  try {
    await sendPredictionConfirmation(userId, tournamentId, true);
    await prisma.adminUserActionAudit.create({
      data: {
        adminUserId,
        targetUserId: userId,
        targetEmailHash: "prediction-confirmation",
        action: "RESEND_PREDICTION_CONFIRMATION",
        status: "SUCCEEDED",
        detail: `Resent locked-prediction confirmation for competition ${tournamentId}.`,
      },
    });
    return NextResponse.json({ success: true, message: "Prediction confirmation email resent." });
  } catch (error) {
    await prisma.adminUserActionAudit.create({
      data: {
        adminUserId,
        targetUserId: userId,
        targetEmailHash: "prediction-confirmation",
        action: "RESEND_PREDICTION_CONFIRMATION",
        status: "FAILED",
        detail: `Locked-prediction confirmation resend failed for competition ${tournamentId}.`,
      },
    }).catch(() => undefined);
    console.error("Admin prediction confirmation resend failed", error);
    return NextResponse.json({ success: false, error: "The prediction confirmation email could not be resent." }, { status: 502 });
  }
}
