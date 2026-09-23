import crypto from "crypto";
import type { CompetitionEntryStatus, PaymentStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCurrentTournament } from "@/lib/currentTournament";
import { sendCompetitionInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 30;
const INVITATION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000;
const ENTRY_STATUSES = ["ALL", "INVITED", "ENTERED", "WITHDRAWN"] as const;
const PAYMENT_STATUSES = ["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED"] as const;
const VERIFICATION_FILTERS = ["ALL", "VERIFIED", "UNVERIFIED"] as const;
const PREDICTION_FILTERS = ["ALL", "COMPLETE", "INCOMPLETE", "NOT_STARTED"] as const;
const ACTIONS = ["ADD", "INVITE", "WITHDRAW", "RESTORE", "CANCEL_INVITATION", "RESEND_INVITATION"] as const;

type Action = typeof ACTIONS[number];

function allowedValue<T extends readonly string[]>(value: string | null, allowed: T): T[number] {
  return allowed.includes(value as T[number]) ? value as T[number] : allowed[0];
}

function normaliseEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

function emailHash(email: string) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

function invitationTokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function competitionTitle(tournament: { year: number; name: string }) {
  return `${tournament.year} ${tournament.name}`;
}

async function resolveTournament(requestedId: unknown) {
  const tournamentId = Number(requestedId);
  if (Number.isInteger(tournamentId) && tournamentId > 0) {
    return prisma.tournament.findUnique({ where: { id: tournamentId } });
  }
  return getCurrentTournament();
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const params = new URL(request.url).searchParams;
    const tournament = await resolveTournament(params.get("tournamentId"));
    const tournaments = await prisma.tournament.findMany({
      orderBy: [{ year: "desc" }, { id: "desc" }],
      select: { id: true, year: true, name: true, status: true },
    });
    if (!tournament) {
      return NextResponse.json({ success: true, tournaments, tournament: null, entries: [], invitations: [], pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 }, totals: { invited: 0, entered: 0, withdrawn: 0, pendingInvitations: 0 } });
    }

    const query = (params.get("q") ?? "").trim().slice(0, 120);
    const entryStatus = allowedValue(params.get("status"), ENTRY_STATUSES);
    const payment = allowedValue(params.get("payment"), PAYMENT_STATUSES);
    const verification = allowedValue(params.get("verification"), VERIFICATION_FILTERS);
    const predictions = allowedValue(params.get("predictions"), PREDICTION_FILTERS);
    const requestedPage = Number(params.get("page"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const where: Prisma.CompetitionEntryWhereInput = {
      tournamentId: tournament.id,
      ...(entryStatus !== "ALL" ? { status: entryStatus as CompetitionEntryStatus } : {}),
      ...(payment !== "ALL" ? { paymentStatus: payment as PaymentStatus } : {}),
      ...(predictions === "COMPLETE" ? { predictionsSubmitted: true } : {}),
      ...(predictions === "INCOMPLETE" ? { predictionsSubmitted: false } : {}),
      user: {
        deletedAt: null,
        ...(verification === "VERIFIED" ? { emailVerified: true } : {}),
        ...(verification === "UNVERIFIED" ? { emailVerified: false } : {}),
        ...(query ? { OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { mobile: { contains: query } },
        ] } : {}),
        ...(predictions === "NOT_STARTED" ? { predictions: { none: { match: { tournamentId: tournament.id } } } } : {}),
        ...(predictions === "INCOMPLETE" ? { predictions: { some: { match: { tournamentId: tournament.id } } } } : {}),
      },
    };

    const [total, statusCounts, pendingInvitations] = await Promise.all([
      prisma.competitionEntry.count({ where }),
      prisma.competitionEntry.groupBy({ by: ["status"], where: { tournamentId: tournament.id }, _count: { _all: true } }),
      prisma.competitionInvitation.count({ where: { tournamentId: tournament.id, status: "PENDING", expiresAt: { gt: new Date() } } }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const [entries, invitations] = await Promise.all([
      prisma.competitionEntry.findMany({
        where,
        orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }, { id: "asc" }],
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          paidAt: true,
          predictionsSubmitted: true,
          predictionSubmittedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true, mobile: true, emailVerified: true,
              _count: { select: { predictions: { where: { match: { tournamentId: tournament.id } } } } },
            },
          },
        },
      }),
      prisma.competitionInvitation.findMany({
        where: { tournamentId: tournament.id, status: "PENDING" },
        orderBy: [{ invitedAt: "desc" }, { id: "desc" }],
        select: { id: true, email: true, firstName: true, lastName: true, mobile: true, status: true, expiresAt: true, invitedAt: true },
      }),
    ]);
    const statusMap = new Map(statusCounts.map((row) => [row.status, row._count._all]));

    return NextResponse.json({
      success: true,
      tournaments,
      tournament: { id: tournament.id, year: tournament.year, name: tournament.name, status: tournament.status },
      entries: entries.map((entry) => ({ ...entry, predictionCount: entry.user._count.predictions, user: { ...entry.user, _count: undefined } })),
      invitations,
      pagination: { page: safePage, pageSize: PAGE_SIZE, total, totalPages },
      totals: {
        invited: statusMap.get("INVITED") ?? 0,
        entered: statusMap.get("ENTERED") ?? 0,
        withdrawn: statusMap.get("WITHDRAWN") ?? 0,
        pendingInvitations,
      },
    });
  } catch (error) {
    console.error("Entrant manager load failed", error);
    return NextResponse.json({ success: false, error: "Unable to load competition entrants." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUser = auth.user!;

  try {
    const body = await request.json();
    const action = ACTIONS.includes(body.action) ? body.action as Action : null;
    if (!action || body.confirmed !== true) {
      return NextResponse.json({ success: false, error: "A valid action and explicit confirmation are required." }, { status: 400 });
    }
    const tournament = await resolveTournament(body.tournamentId);
    if (!tournament) return NextResponse.json({ success: false, error: "Competition not found." }, { status: 404 });

    if (action === "ADD" || action === "INVITE") {
      const email = normaliseEmail(body.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
      }
      const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, deletedAt: null } });
      if (!user && action === "ADD") {
        return NextResponse.json({ success: false, error: "No active account uses that email address. Send an invitation instead." }, { status: 404 });
      }

      if (user) {
        const existing = await prisma.competitionEntry.findUnique({ where: { userId_tournamentId: { userId: user.id, tournamentId: tournament.id } } });
        const nextStatus: CompetitionEntryStatus = action === "ADD" ? "ENTERED" : existing?.status === "ENTERED" ? "ENTERED" : "INVITED";
        await prisma.$transaction(async (tx) => {
          await tx.competitionEntry.upsert({
            where: { userId_tournamentId: { userId: user.id, tournamentId: tournament.id } },
            update: { status: nextStatus, withdrawnFromStatus: null },
            create: { userId: user.id, tournamentId: tournament.id, status: nextStatus },
          });
          await tx.adminUserActionAudit.create({ data: {
            adminUserId: adminUser.id, targetUserId: user.id,
            action: action === "ADD" ? "ADD_ENTRANT" : "INVITE_ENTRANT", status: "SUCCEEDED",
            targetEmailHash: emailHash(user.email), detail: `${competitionTitle(tournament)}; status ${nextStatus}.`,
          } });
        });
        let warning: string | undefined;
        if (action === "INVITE" && (!existing || existing.status !== "ENTERED")) {
          try { await sendCompetitionInvitationEmail({ email: user.email, competitionName: competitionTitle(tournament) }); }
          catch (error) { console.error("Existing-user invitation email failed", error); warning = "The invitation was recorded, but the email could not be sent."; }
        }
        return NextResponse.json({ success: true, message: nextStatus === "ENTERED" ? "The user is entered in the competition." : "The existing user was invited.", warning });
      }

      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);
      const invitation = await prisma.$transaction(async (tx) => {
        const saved = await tx.competitionInvitation.upsert({
          where: { tournamentId_email: { tournamentId: tournament.id, email } },
          update: {
            firstName: typeof body.firstName === "string" ? body.firstName.trim().slice(0, 60) || null : null,
            lastName: typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) || null : null,
            mobile: typeof body.mobile === "string" ? body.mobile.trim().slice(0, 30) || null : null,
            tokenHash: invitationTokenHash(token), status: "PENDING", expiresAt, invitedById: adminUser.id, acceptedUserId: null, acceptedAt: null,
          },
          create: {
            tournamentId: tournament.id, email,
            firstName: typeof body.firstName === "string" ? body.firstName.trim().slice(0, 60) || null : null,
            lastName: typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) || null : null,
            mobile: typeof body.mobile === "string" ? body.mobile.trim().slice(0, 30) || null : null,
            tokenHash: invitationTokenHash(token), expiresAt, invitedById: adminUser.id,
          },
        });
        await tx.adminUserActionAudit.create({ data: {
          adminUserId: adminUser.id, targetUserId: null, targetReference: `Invitation ${saved.id}`,
          action: "INVITE_ENTRANT", status: "SUCCEEDED", targetEmailHash: emailHash(email),
          detail: `${competitionTitle(tournament)}; registration invitation created.`,
        } });
        return saved;
      });
      try {
        await sendCompetitionInvitationEmail({ email, competitionName: competitionTitle(tournament), registrationToken: token });
        return NextResponse.json({ success: true, message: "A registration invitation was sent.", invitationId: invitation.id });
      } catch (error) {
        console.error("Registration invitation email failed", error);
        return NextResponse.json({ success: true, message: "The registration invitation was recorded.", warning: "The email could not be sent. Use Resend Invitation to try again.", invitationId: invitation.id });
      }
    }

    if (action === "CANCEL_INVITATION" || action === "RESEND_INVITATION") {
      const invitationId = Number(body.invitationId);
      const invitation = await prisma.competitionInvitation.findFirst({ where: { id: invitationId, tournamentId: tournament.id } });
      if (!invitation || invitation.status !== "PENDING") return NextResponse.json({ success: false, error: "Pending invitation not found." }, { status: 404 });
      if (action === "CANCEL_INVITATION") {
        await prisma.$transaction([
          prisma.competitionInvitation.update({ where: { id: invitation.id }, data: { status: "CANCELLED" } }),
          prisma.adminUserActionAudit.create({ data: { adminUserId: adminUser.id, targetUserId: null, targetReference: `Invitation ${invitation.id}`, action: "CANCEL_ENTRANT_INVITATION", status: "SUCCEEDED", targetEmailHash: emailHash(invitation.email), detail: `${competitionTitle(tournament)}; registration invitation cancelled.` } }),
        ]);
        return NextResponse.json({ success: true, message: "The registration invitation was cancelled." });
      }
      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      await prisma.competitionInvitation.update({ where: { id: invitation.id }, data: { tokenHash: invitationTokenHash(token), expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS) } });
      try {
        await sendCompetitionInvitationEmail({ email: invitation.email, competitionName: competitionTitle(tournament), registrationToken: token });
        await prisma.adminUserActionAudit.create({ data: { adminUserId: adminUser.id, targetUserId: null, targetReference: `Invitation ${invitation.id}`, action: "RESEND_ENTRANT_INVITATION", status: "SUCCEEDED", targetEmailHash: emailHash(invitation.email), detail: `${competitionTitle(tournament)}; registration invitation resent.` } });
        return NextResponse.json({ success: true, message: "The registration invitation was resent." });
      } catch {
        await prisma.adminUserActionAudit.create({ data: { adminUserId: adminUser.id, targetUserId: null, targetReference: `Invitation ${invitation.id}`, action: "RESEND_ENTRANT_INVITATION", status: "FAILED", targetEmailHash: emailHash(invitation.email), detail: "Invitation delivery failed." } });
        return NextResponse.json({ success: false, error: "The invitation email could not be sent." }, { status: 502 });
      }
    }

    const entryId = Number(body.entryId);
    const entry = await prisma.competitionEntry.findFirst({ where: { id: entryId, tournamentId: tournament.id }, include: { user: true } });
    if (!entry) return NextResponse.json({ success: false, error: "Competition entry not found." }, { status: 404 });
    if (entry.user.deletedAt) return NextResponse.json({ success: false, error: "A deleted account cannot be changed." }, { status: 409 });

    if (action === "WITHDRAW") {
      if (entry.status === "WITHDRAWN") return NextResponse.json({ success: false, error: "This entrant is already withdrawn." }, { status: 409 });
      await prisma.$transaction([
        prisma.competitionEntry.update({ where: { id: entry.id }, data: { withdrawnFromStatus: entry.status, status: "WITHDRAWN" } }),
        prisma.adminUserActionAudit.create({ data: { adminUserId: adminUser.id, targetUserId: entry.userId, action: "WITHDRAW_ENTRANT", status: "SUCCEEDED", targetEmailHash: emailHash(entry.user.email), detail: `${competitionTitle(tournament)}; previous status ${entry.status}.` } }),
      ]);
      return NextResponse.json({ success: true, message: "The entrant was withdrawn. Their account and competition history were preserved." });
    }

    if (entry.status !== "WITHDRAWN") return NextResponse.json({ success: false, error: "Only a withdrawn entrant can be restored." }, { status: 409 });
    const restoredStatus = entry.withdrawnFromStatus === "INVITED" ? "INVITED" : "ENTERED";
    await prisma.$transaction([
      prisma.competitionEntry.update({ where: { id: entry.id }, data: { status: restoredStatus, withdrawnFromStatus: null } }),
      prisma.adminUserActionAudit.create({ data: { adminUserId: adminUser.id, targetUserId: entry.userId, action: "RESTORE_ENTRANT", status: "SUCCEEDED", targetEmailHash: emailHash(entry.user.email), detail: `${competitionTitle(tournament)}; restored as ${restoredStatus}.` } }),
    ]);
    return NextResponse.json({ success: true, message: `The entrant was restored as ${restoredStatus.toLowerCase()}.` });
  } catch (error) {
    console.error("Entrant manager action failed", error);
    return NextResponse.json({ success: false, error: "The entrant action could not be completed." }, { status: 500 });
  }
}
