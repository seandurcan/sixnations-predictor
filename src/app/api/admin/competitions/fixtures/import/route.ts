import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  prepareFixtureImport,
  SIX_NATIONS_TEAM_NAMES,
  type FixtureImportInput,
} from "@/lib/fixtureImport";

export async function POST(request: NextRequest) {
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
  const submittedFixtures = Array.isArray(body.fixtures)
    ? (body.fixtures as FixtureImportInput[])
    : [];

  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid draft competition." },
      { status: 400 }
    );
  }

  const competition = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, year: true, status: true },
  });
  if (!competition) {
    return NextResponse.json(
      { success: false, error: "Competition not found." },
      { status: 404 }
    );
  }
  if (competition.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Fixtures can only be imported into a draft competition." },
      { status: 409 }
    );
  }

  const prepared = prepareFixtureImport(submittedFixtures, competition.year);
  if (prepared.errors.length > 0) {
    return NextResponse.json(
      { success: false, error: "Fixture validation failed.", errors: prepared.errors },
      { status: 400 }
    );
  }

  const teams = await prisma.team.findMany({
    where: { name: { in: [...SIX_NATIONS_TEAM_NAMES] } },
    select: { id: true, name: true },
  });
  if (teams.length !== SIX_NATIONS_TEAM_NAMES.length) {
    return NextResponse.json(
      { success: false, error: "The permanent Six Nations team set is incomplete." },
      { status: 409 }
    );
  }
  const teamIds = new Map(teams.map((team) => [team.name, team.id]));
  const firstKickoff = prepared.fixtures[0].kickoffTime;
  const predictionLockAt = new Date(firstKickoff.getTime() - 60_000);
  const approvedAt = new Date();

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(82316, ${tournamentId}::integer)`;
        const current = await tx.tournament.findUnique({
          where: { id: tournamentId },
          select: { status: true, _count: { select: { matches: true } } },
        });
        if (!current || current.status !== "DRAFT") {
          throw new Error("Competition is no longer an importable draft.");
        }
        if (current._count.matches !== 0) {
          throw new Error("Fixtures have already been imported for this competition.");
        }

        await tx.match.createMany({
          data: prepared.fixtures.map((fixture) => ({
            tournamentId,
            round: fixture.round,
            matchNumber: fixture.matchNumber,
            kickoffTime: fixture.kickoffTime,
            venue: fixture.venue,
            city: fixture.city,
            country: fixture.country,
            homeTeamId: teamIds.get(fixture.homeTeam)!,
            awayTeamId: teamIds.get(fixture.awayTeam)!,
            sourceUrl: fixture.providerGameId ? "https://api-sports.io/" : null,
            notes: fixture.providerGameId
              ? `Imported from API-Sports game ${fixture.providerGameId}`
              : "Reviewed and imported by an administrator",
          })),
        });

        await tx.tournament.update({
          where: { id: tournamentId },
          data: { firstKickoff, predictionLockAt },
        });

        await tx.systemSetting.upsert({
          where: { key: `FIXTURE_IMPORT_AUDIT_${tournamentId}` },
          update: {
            value: JSON.stringify({
              tournamentId,
              approvedByUserId: adminUserId,
              approvedAt: approvedAt.toISOString(),
              fixtureCount: prepared.fixtures.length,
              source: "API-Sports/Admin review",
            }),
          },
          create: {
            key: `FIXTURE_IMPORT_AUDIT_${tournamentId}`,
            value: JSON.stringify({
              tournamentId,
              approvedByUserId: adminUserId,
              approvedAt: approvedAt.toISOString(),
              fixtureCount: prepared.fixtures.length,
              source: "API-Sports/Admin review",
            }),
          },
        });
      },
      { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fixture import failed.";
    const conflict = message.includes("already") || message.includes("no longer");
    console.error("Fixture import failed", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: conflict ? 409 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    imported: prepared.fixtures.length,
    competition: {
      id: competition.id,
      name: competition.name,
      status: "DRAFT",
      firstKickoff: firstKickoff.toISOString(),
      predictionLockAt: predictionLockAt.toISOString(),
    },
  });
}
