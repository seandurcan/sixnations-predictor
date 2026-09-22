import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { duplicateReasons, findDuplicateCandidates } from "@/lib/duplicateAccounts";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;
const DECISIONS = ["UNREVIEWED", "SAME_PERSON", "NOT_DUPLICATE"] as const;

function emailHash(email: string) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function requestedDecision(value: string | null) {
  return DECISIONS.includes(value as typeof DECISIONS[number])
    ? value as typeof DECISIONS[number]
    : "UNREVIEWED";
}

const accountSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  mobile: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  competitionEntries: {
    orderBy: { tournament: { year: "desc" as const } },
    select: {
      status: true,
      paymentStatus: true,
      predictionsSubmitted: true,
      tournament: { select: { id: true, year: true, name: true } },
    },
  },
  _count: {
    select: {
      predictions: true,
      payments: true,
      submissions: true,
      competitionEntries: true,
    },
  },
};

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const searchParams = new URL(request.url).searchParams;
    const decisionFilter = requestedDecision(searchParams.get("decision"));
    const requestedPage = Number(searchParams.get("page"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
      select: accountSelect,
    });
    const candidates = findDuplicateCandidates(users);
    const userIds = users.map((user) => user.id);
    const reviews = userIds.length ? await prisma.duplicateAccountReview.findMany({
      where: { lowerUserId: { in: userIds }, higherUserId: { in: userIds } },
      orderBy: { reviewedAt: "desc" },
    }) : [];
    const reviewMap = new Map(reviews.map((review) => [
      `${review.lowerUserId}:${review.higherUserId}`,
      review,
    ]));
    const records = candidates.map((candidate) => {
      const review = reviewMap.get(`${candidate.lowerUser.id}:${candidate.higherUser.id}`);
      return {
        ...candidate,
        decision: review?.decision ?? "UNREVIEWED",
        reviewedAt: review?.reviewedAt ?? null,
        reviewedById: review?.reviewedById ?? null,
      };
    });
    const filtered = records.filter((record) => record.decision === decisionFilter);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    return NextResponse.json({
      success: true,
      candidates: filtered.slice(start, start + PAGE_SIZE),
      pagination: { page: safePage, pageSize: PAGE_SIZE, total: filtered.length, totalPages },
      totals: {
        all: records.length,
        unreviewed: records.filter((record) => record.decision === "UNREVIEWED").length,
        samePerson: records.filter((record) => record.decision === "SAME_PERSON").length,
        notDuplicate: records.filter((record) => record.decision === "NOT_DUPLICATE").length,
      },
      filter: decisionFilter,
    });
  } catch (error) {
    console.error("Duplicate account review load failed", error);
    return NextResponse.json({ success: false, error: "Unable to load duplicate account candidates." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) {
    return NextResponse.json({ success: false, error: "Administrator account unavailable." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    firstUserId?: unknown;
    secondUserId?: unknown;
    decision?: unknown;
  } | null;
  const firstUserId = Number(body?.firstUserId);
  const secondUserId = Number(body?.secondUserId);
  const decision = body?.decision;
  if (!Number.isInteger(firstUserId) || firstUserId <= 0
    || !Number.isInteger(secondUserId) || secondUserId <= 0 || firstUserId === secondUserId
    || (decision !== "SAME_PERSON" && decision !== "NOT_DUPLICATE")) {
    return NextResponse.json({ success: false, error: "Select a valid duplicate-review decision." }, { status: 400 });
  }
  const lowerUserId = Math.min(firstUserId, secondUserId);
  const higherUserId = Math.max(firstUserId, secondUserId);
  const users = await prisma.user.findMany({
    where: { id: { in: [lowerUserId, higherUserId] }, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true, mobile: true },
  });
  if (users.length !== 2) {
    return NextResponse.json({ success: false, error: "One or both accounts are unavailable." }, { status: 404 });
  }
  const lowerUser = users.find((user) => user.id === lowerUserId)!;
  const higherUser = users.find((user) => user.id === higherUserId)!;
  if (duplicateReasons(lowerUser, higherUser).length === 0) {
    return NextResponse.json({ success: false, error: "These accounts no longer match the review criteria." }, { status: 409 });
  }

  const reviewedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.duplicateAccountReview.upsert({
      where: { lowerUserId_higherUserId: { lowerUserId, higherUserId } },
      create: { lowerUserId, higherUserId, decision, reviewedById: adminUserId, reviewedAt },
      update: { decision, reviewedById: adminUserId, reviewedAt },
    });
    await tx.adminUserActionAudit.create({
      data: {
        adminUserId,
        targetUserId: lowerUserId,
        targetEmailHash: emailHash(lowerUser.email),
        action: "DUPLICATE_REVIEW",
        status: "SUCCEEDED",
        detail: `Compared accounts ${lowerUserId} and ${higherUserId}; classified as ${decision === "SAME_PERSON" ? "same person" : "not duplicate"}. No account data changed.`,
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: decision === "SAME_PERSON"
      ? "The accounts were marked as the same person. No records were merged or changed."
      : "The accounts were marked as not duplicates. No account data was changed.",
    decision,
  });
}
