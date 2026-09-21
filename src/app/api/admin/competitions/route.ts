import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  CURRENT_TOURNAMENT_SETTING,
  getCurrentTournament,
} from "@/lib/currentTournament";

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
    if (!entryFee.isFinite() || entryFee.isNegative() || entryFee.greaterThan(10000)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid non-negative entry fee." },
        { status: 400 }
      );
    }

    const teamCount = await prisma.team.count({
      where: { name: { in: [...PERMANENT_TEAMS] } },
    });
    if (teamCount !== PERMANENT_TEAMS.length) {
      return NextResponse.json(
        { success: false, error: "The permanent Six Nations team set is incomplete." },
        { status: 409 }
      );
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
        { success: false, error: "A competition already exists for that year." },
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

  const body = await request.json().catch(() => ({}));
  const tournamentId = Number(body.tournamentId);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid competition." },
      { status: 400 }
    );
  }

  const competition = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { matches: true } } },
  });
  if (!competition) {
    return NextResponse.json(
      { success: false, error: "Competition not found." },
      { status: 404 }
    );
  }
  if (competition.status === "DRAFT" || competition._count.matches === 0) {
    return NextResponse.json(
      { success: false, error: "A draft competition cannot become current until its fixtures are approved." },
      { status: 409 }
    );
  }

  await prisma.systemSetting.upsert({
    where: { key: CURRENT_TOURNAMENT_SETTING },
    update: { value: String(tournamentId) },
    create: { key: CURRENT_TOURNAMENT_SETTING, value: String(tournamentId) },
  });

  return NextResponse.json({ success: true, currentTournamentId: tournamentId });
}
