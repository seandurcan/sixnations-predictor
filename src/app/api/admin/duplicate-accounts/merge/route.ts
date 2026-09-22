import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

type Resolution = "KEEP_SURVIVOR" | "KEEP_REDUNDANT";

function emailHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function loadPair(firstUserId: number, secondUserId: number) {
  if (!Number.isInteger(firstUserId) || firstUserId <= 0 || !Number.isInteger(secondUserId)
    || secondUserId <= 0 || firstUserId === secondUserId) return null;
  const lowerUserId = Math.min(firstUserId, secondUserId);
  const higherUserId = Math.max(firstUserId, secondUserId);
  const [users, review] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: [lowerUserId, higherUserId] }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, paymentStatus: true, paidAt: true, predictionsSubmitted: true, predictionSubmittedAt: true },
    }),
    prisma.duplicateAccountReview.findUnique({ where: { lowerUserId_higherUserId: { lowerUserId, higherUserId } } }),
  ]);
  if (users.length !== 2 || review?.decision !== "SAME_PERSON") return null;
  return { users, review, lowerUserId, higherUserId };
}

async function buildPreview(firstUserId: number, secondUserId: number, survivorUserId: number) {
  const pair = await loadPair(firstUserId, secondUserId);
  if (!pair || !pair.users.some((user) => user.id === survivorUserId)) return null;
  const survivor = pair.users.find((user) => user.id === survivorUserId)!;
  const redundant = pair.users.find((user) => user.id !== survivorUserId)!;
  if (survivor.role === "ADMIN" || redundant.role === "ADMIN") return { forbidden: true as const, survivor, redundant };
  const [survivorPredictions, redundantPredictions, survivorEntries, redundantEntries,
    survivorSnapshots, redundantSnapshots, survivorWins, redundantWins,
    survivorConfirmations, redundantConfirmations, counts] = await Promise.all([
    prisma.prediction.findMany({ where: { userId: survivor.id }, select: { matchId: true } }),
    prisma.prediction.findMany({ where: { userId: redundant.id }, select: { matchId: true } }),
    prisma.competitionEntry.findMany({ where: { userId: survivor.id }, select: { tournamentId: true } }),
    prisma.competitionEntry.findMany({ where: { userId: redundant.id }, select: { tournamentId: true } }),
    prisma.leaderboardSnapshot.findMany({ where: { userId: survivor.id }, select: { tournamentId: true, snapshotNumber: true } }),
    prisma.leaderboardSnapshot.findMany({ where: { userId: redundant.id }, select: { tournamentId: true, snapshotNumber: true } }),
    prisma.tournamentWinner.findMany({ where: { userId: survivor.id }, select: { tournamentId: true } }),
    prisma.tournamentWinner.findMany({ where: { userId: redundant.id }, select: { tournamentId: true } }),
    prisma.predictionConfirmationDelivery.findMany({ where: { userId: survivor.id }, select: { tournamentId: true } }),
    prisma.predictionConfirmationDelivery.findMany({ where: { userId: redundant.id }, select: { tournamentId: true } }),
    Promise.all([
      prisma.payment.count({ where: { userId: redundant.id } }),
      prisma.predictionSubmission.count({ where: { userId: redundant.id } }),
    ]),
  ]);
  const survivorMatchIds = new Set(survivorPredictions.map((item) => item.matchId));
  const survivorTournamentIds = new Set(survivorEntries.map((item) => item.tournamentId));
  const survivorSnapshotKeys = new Set(survivorSnapshots.map((item) => `${item.tournamentId}:${item.snapshotNumber}`));
  const survivorWinTournamentIds = new Set(survivorWins.map((item) => item.tournamentId));
  const survivorConfirmationTournamentIds = new Set(survivorConfirmations.map((item) => item.tournamentId));
  return {
    forbidden: false as const,
    survivor,
    redundant,
    conflicts: {
      predictions: redundantPredictions.filter((item) => survivorMatchIds.has(item.matchId)).length,
      competitionEntries: redundantEntries.filter((item) => survivorTournamentIds.has(item.tournamentId)).length,
      leaderboardSnapshots: redundantSnapshots.filter((item) => survivorSnapshotKeys.has(`${item.tournamentId}:${item.snapshotNumber}`)).length,
      tournamentWins: redundantWins.filter((item) => survivorWinTournamentIds.has(item.tournamentId)).length,
      predictionConfirmations: redundantConfirmations.filter((item) => survivorConfirmationTournamentIds.has(item.tournamentId)).length,
    },
    transfers: {
      predictions: redundantPredictions.length,
      competitionEntries: redundantEntries.length,
      payments: counts[0],
      submissions: counts[1],
      leaderboardSnapshots: redundantSnapshots.length,
      tournamentWins: redundantWins.length,
      predictionConfirmations: redundantConfirmations.length,
    },
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) return NextResponse.json({ success: false, error: "Administrator account unavailable." }, { status: 403 });
  const body = await request.json().catch(() => null) as {
    action?: unknown;
    firstUserId?: unknown;
    secondUserId?: unknown;
    survivorUserId?: unknown;
    conflictResolution?: unknown;
    confirmationEmail?: unknown;
  } | null;
  const firstUserId = Number(body?.firstUserId);
  const secondUserId = Number(body?.secondUserId);
  const survivorUserId = Number(body?.survivorUserId);
  const preview = await buildPreview(firstUserId, secondUserId, survivorUserId);
  if (!preview) return NextResponse.json({ success: false, error: "Only accounts classified as the same person can be merged." }, { status: 409 });
  if (preview.forbidden) return NextResponse.json({ success: false, error: "Administrator accounts cannot be merged." }, { status: 409 });
  if (body?.action === "preview") return NextResponse.json({ success: true, preview });
  if (body?.action !== "merge") return NextResponse.json({ success: false, error: "Select a valid merge action." }, { status: 400 });
  const resolution = body.conflictResolution as Resolution;
  if (resolution !== "KEEP_SURVIVOR" && resolution !== "KEEP_REDUNDANT") {
    return NextResponse.json({ success: false, error: "Choose which account record wins where records conflict." }, { status: 400 });
  }
  const confirmationEmail = typeof body.confirmationEmail === "string" ? body.confirmationEmail.trim().toLowerCase() : "";
  if (confirmationEmail !== preview.survivor.email.toLowerCase()) {
    return NextResponse.json({ success: false, error: "Enter the surviving account email address exactly to confirm the merge." }, { status: 400 });
  }

  const survivor = preview.survivor;
  const redundant = preview.redundant;
  const keepRedundant = resolution === "KEEP_REDUNDANT";
  const deletedAt = new Date();
  const anonymousEmail = `merged-${redundant.id}-${crypto.randomUUID()}@accounts.invalid`;
  const anonymousPassword = crypto.randomUUID() + crypto.randomUUID();

  try {
    await prisma.$transaction(async (tx) => {
    const [lockedUsers, lockedReview] = await Promise.all([
      tx.user.findMany({
        where: { id: { in: [survivor.id, redundant.id] }, deletedAt: null, role: "USER" },
        select: { id: true },
      }),
      tx.duplicateAccountReview.findUnique({
        where: { lowerUserId_higherUserId: { lowerUserId: Math.min(survivor.id, redundant.id), higherUserId: Math.max(survivor.id, redundant.id) } },
      }),
    ]);
    if (lockedUsers.length !== 2 || lockedReview?.decision !== "SAME_PERSON") {
      throw new Error("The duplicate review changed before the merge could be completed.");
    }
    const [survivorPredictions, redundantPredictions, survivorEntries, redundantEntries,
      survivorSnapshots, redundantSnapshots, survivorWins, redundantWins, survivorConfirmations, redundantConfirmations] = await Promise.all([
      tx.prediction.findMany({ where: { userId: survivor.id }, select: { id: true, matchId: true } }),
      tx.prediction.findMany({ where: { userId: redundant.id }, select: { id: true, matchId: true } }),
      tx.competitionEntry.findMany({ where: { userId: survivor.id }, select: { id: true, tournamentId: true } }),
      tx.competitionEntry.findMany({ where: { userId: redundant.id }, select: { id: true, tournamentId: true } }),
      tx.leaderboardSnapshot.findMany({ where: { userId: survivor.id }, select: { id: true, tournamentId: true, snapshotNumber: true } }),
      tx.leaderboardSnapshot.findMany({ where: { userId: redundant.id }, select: { id: true, tournamentId: true, snapshotNumber: true } }),
      tx.tournamentWinner.findMany({ where: { userId: survivor.id }, select: { id: true, tournamentId: true } }),
      tx.tournamentWinner.findMany({ where: { userId: redundant.id }, select: { id: true, tournamentId: true } }),
      tx.predictionConfirmationDelivery.findMany({ where: { userId: survivor.id }, select: { id: true, tournamentId: true } }),
      tx.predictionConfirmationDelivery.findMany({ where: { userId: redundant.id }, select: { id: true, tournamentId: true } }),
    ]);

    const resolveConflicts = async <T extends { id: number }>(survivorRows: T[], redundantRows: T[], key: (row: T) => string, remove: (ids: number[]) => Promise<unknown>) => {
      const survivorKeys = new Map(survivorRows.map((row) => [key(row), row.id]));
      const conflicts = redundantRows.filter((row) => survivorKeys.has(key(row)));
      const ids = keepRedundant
        ? conflicts.map((row) => survivorKeys.get(key(row))!).filter(Boolean)
        : conflicts.map((row) => row.id);
      if (ids.length) await remove(ids);
    };
    await resolveConflicts(survivorPredictions, redundantPredictions, (row) => String(row.matchId), (ids) => tx.prediction.deleteMany({ where: { id: { in: ids } } }));
    await resolveConflicts(survivorEntries, redundantEntries, (row) => String(row.tournamentId), (ids) => tx.competitionEntry.deleteMany({ where: { id: { in: ids } } }));
    await resolveConflicts(survivorSnapshots, redundantSnapshots, (row) => `${row.tournamentId}:${row.snapshotNumber}`, (ids) => tx.leaderboardSnapshot.deleteMany({ where: { id: { in: ids } } }));
    await resolveConflicts(survivorWins, redundantWins, (row) => String(row.tournamentId), (ids) => tx.tournamentWinner.deleteMany({ where: { id: { in: ids } } }));
    await resolveConflicts(survivorConfirmations, redundantConfirmations, (row) => String(row.tournamentId), (ids) => tx.predictionConfirmationDelivery.deleteMany({ where: { id: { in: ids } } }));

    await Promise.all([
      tx.prediction.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.competitionEntry.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.payment.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.predictionSubmission.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.leaderboardSnapshot.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.tournamentWinner.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.predictionConfirmationDelivery.updateMany({ where: { userId: redundant.id }, data: { userId: survivor.id } }),
      tx.announcementDelivery.updateMany({ where: { recipientUserId: redundant.id }, data: { recipientUserId: survivor.id } }),
      tx.session.deleteMany({ where: { userId: redundant.id } }),
      tx.passwordReset.deleteMany({ where: { userId: redundant.id } }),
      tx.emailVerification.deleteMany({ where: { userId: redundant.id } }),
      tx.emailPreferenceToken.deleteMany({ where: { userId: redundant.id } }),
    ]);
    await tx.duplicateAccountReview.deleteMany({
      where: { OR: [{ lowerUserId: redundant.id }, { higherUserId: redundant.id }] },
    });
    await tx.user.update({
      where: { id: survivor.id },
      data: {
        paymentStatus: survivor.paymentStatus === "COMPLETED" || redundant.paymentStatus === "COMPLETED" ? "COMPLETED" : survivor.paymentStatus,
        paidAt: survivor.paidAt ?? redundant.paidAt,
        predictionsSubmitted: survivor.predictionsSubmitted || redundant.predictionsSubmitted,
        predictionSubmittedAt: survivor.predictionSubmittedAt ?? redundant.predictionSubmittedAt,
      },
    });
    await tx.user.update({
      where: { id: redundant.id },
      data: {
        firstName: "Merged",
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
        targetUserId: redundant.id,
        targetEmailHash: emailHash(redundant.email),
        action: "MERGE_ACCOUNTS",
        status: "SUCCEEDED",
        detail: `Merged account ${redundant.id} into account ${survivor.id}; conflict rule ${resolution}.`,
      },
    });
    });
  } catch (error) {
    console.error("Duplicate account merge failed", error);
    return NextResponse.json({ success: false, error: "The accounts could not be merged. No partial merge was retained." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Account ${redundant.id} was merged into account ${survivor.id}. The redundant login was disabled and anonymised.`,
  });
}
