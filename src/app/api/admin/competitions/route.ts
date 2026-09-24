import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  CURRENT_TOURNAMENT_SETTING,
  getCurrentTournament,
} from "@/lib/currentTournament";
import { validateCompetitionReadiness } from "@/lib/competitionReadiness";
import { isSixNationsCompetition } from "@/lib/fixtureDiscovery";

const PERMANENT_TEAMS = [
  "England",
  "France",
  "Ireland",
  "Italy",
  "Scotland",
  "Wales",
] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const [competitions, currentTournament, teams] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: [{ year: "desc" }, { id: "desc" }],
      include: {
        _count: { select: { matches: true, entries: true } },
      },
    }),
    getCurrentTournament(),
    prisma.team.findMany({
      where: { name: { in: [...PERMANENT_TEAMS] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    currentTournamentId: currentTournament?.id ?? null,
    permanentTeams: teams,
    permanentTeamSetComplete: teams.length === PERMANENT_TEAMS.length,
    competitions,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const year = Number(body.year);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    let entryFee: Prisma.Decimal;
    try {
      entryFee = new Prisma.Decimal(String(body.entryFee ?? "20"));
    } catch {
      return NextResponse.json(
        { success: false, error: "Enter a valid non-negative entry fee." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 1883 || year > 2200) {
      return NextResponse.json(
        { success: false, error: "Enter a valid championship year." },
        { status: 400 }
      );
    }
    if (!name || name.length > 120) {
      return NextResponse.json(
        { success: false, error: "Enter a competition name of 120 characters or fewer." },
        { status: 400 }
      );
    }
    if (/\b\d{4}\b/.test(name)) {
      return NextResponse.json(
        { success: false, error: "Enter the competition name without the year. The year is added automatically." },
        { status: 400 }
      );
    }
    if (!entryFee.isFinite() || entryFee.isNegative() || entryFee.greaterThan(10000)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid non-negative entry fee." },
        { status: 400 }
      );
    }

    if (isSixNationsCompetition(name)) {
      const teamCount = await prisma.team.count({
        where: { name: { in: [...PERMANENT_TEAMS] } },
      });
      if (teamCount !== PERMANENT_TEAMS.length) {
        return NextResponse.json(
          { success: false, error: "The permanent Six Nations team set is incomplete." },
          { status: 409 }
        );
      }
    }

    const competition = await prisma.tournament.create({
      data: {
        year,
        name,
        status: "DRAFT",
        entryFee,
        currency: "EUR",
      },
      include: { _count: { select: { matches: true, entries: true } } },
    });

    return NextResponse.json({ success: true, competition }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "That competition already exists for that season." },
        { status: 409 }
      );
    }
    console.error("Competition creation failed", error);
    return NextResponse.json(
      { success: false, error: "Failed to create the draft competition." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) {
    return NextResponse.json(
      { success: false, error: "Authenticated administrator could not be identified." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const tournamentId = Number(body.tournamentId);
  const action = body.action;
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid competition." },
      { status: 400 }
    );
  }
  if (action !== "mark_ready" && action !== "activate") {
    return NextResponse.json(
      { success: false, error: "Select a valid competition action." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(82317)`;
        const competition = await tx.tournament.findUnique({
          where: { id: tournamentId },
          include: {
            matches: {
              include: {
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
              },
            },
          },
        });
        if (!competition) throw new Error("Competition not found.");

        const readinessErrors = validateCompetitionReadiness(competition);
        if (readinessErrors.length > 0) {
          throw new Error(`Competition validation failed: ${readinessErrors.join(" ")}`);
        }

        if (action === "mark_ready") {
          if (competition.status !== "DRAFT") {
            throw new Error("Only a draft competition can be marked ready.");
          }
          await tx.tournament.update({
            where: { id: tournamentId },
            data: { status: "READY" },
          });
          await tx.systemSetting.upsert({
            where: { key: `COMPETITION_READY_AUDIT_${tournamentId}` },
            update: {
              value: JSON.stringify({
                tournamentId,
                markedReadyByUserId: adminUserId,
                markedReadyAt: new Date().toISOString(),
              }),
            },
            create: {
              key: `COMPETITION_READY_AUDIT_${tournamentId}`,
              value: JSON.stringify({
                tournamentId,
                markedReadyByUserId: adminUserId,
                markedReadyAt: new Date().toISOString(),
              }),
            },
          });
          return { status: "READY", previousTournamentId: null };
        }

        if (competition.status !== "READY") {
          throw new Error("Only a ready competition can be activated.");
        }

        const selected = await tx.systemSetting.findUnique({
          where: { key: CURRENT_TOURNAMENT_SETTING },
        });
        const selectedId = Number(selected?.value);
        let previousCompetition = Number.isInteger(selectedId) && selectedId > 0
          ? await tx.tournament.findUnique({ where: { id: selectedId } })
          : null;
        if (!previousCompetition) {
          previousCompetition = await tx.tournament.findFirst({
            where: { status: { in: ["OPEN", "LOCKED", "IN_PROGRESS"] } },
            orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
          });
        }
        if (
          previousCompetition &&
          previousCompetition.id !== tournamentId &&
          !["COMPLETED", "ARCHIVED", "CANCELLED"].includes(previousCompetition.status)
        ) {
          throw new Error(
            `The current ${previousCompetition.year} competition must be completed before it can be replaced.`
          );
        }

        if (
          previousCompetition &&
          previousCompetition.id !== tournamentId &&
          previousCompetition.status === "COMPLETED"
        ) {
          await tx.tournament.update({
            where: { id: previousCompetition.id },
            data: { status: "ARCHIVED" },
          });
        }
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { status: "OPEN" },
        });
        await tx.systemSetting.upsert({
          where: { key: CURRENT_TOURNAMENT_SETTING },
          update: { value: String(tournamentId) },
          create: { key: CURRENT_TOURNAMENT_SETTING, value: String(tournamentId) },
        });
        await tx.systemSetting.upsert({
          where: { key: `COMPETITION_ACTIVATION_AUDIT_${tournamentId}` },
          update: {
            value: JSON.stringify({
              tournamentId,
              previousTournamentId: previousCompetition?.id ?? null,
              activatedByUserId: adminUserId,
              activatedAt: new Date().toISOString(),
            }),
          },
          create: {
            key: `COMPETITION_ACTIVATION_AUDIT_${tournamentId}`,
            value: JSON.stringify({
              tournamentId,
              previousTournamentId: previousCompetition?.id ?? null,
              activatedByUserId: adminUserId,
              activatedAt: new Date().toISOString(),
            }),
          },
        });

        return {
          status: "OPEN",
          previousTournamentId: previousCompetition?.id ?? null,
        };
      },
      { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 }
    );

    return NextResponse.json({
      success: true,
      currentTournamentId: action === "activate" ? tournamentId : undefined,
      competitionStatus: result.status,
      previousTournamentId: result.previousTournamentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Competition update failed.";
    const notFound = message === "Competition not found.";
    console.error("Competition lifecycle update failed", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : 409 }
    );
  }
}
