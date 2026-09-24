import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  prepareCompetitionFixtureImport,
  type FixtureImportInput,
} from "@/lib/fixtureImport";

function baseShortCode(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (letters.slice(0, 5) || "TEAM").padEnd(3, "X");
}

function nextShortCode(name: string, used: Set<string>) {
  const base = baseShortCode(name);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base.slice(0, 4)}${suffix}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  throw new Error(`Unable to create a unique short code for ${name}.`);
}

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

  const prepared = prepareCompetitionFixtureImport(submittedFixtures, competition);
  if (prepared.errors.length > 0) {
    return NextResponse.json(
      { success: false, error: "Fixture validation failed.", errors: prepared.errors },
      { status: 400 }
    );
  }

  const participantNames = Array.from(
    new Set(
      prepared.fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
    )
  );
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

        const existingTeams = await tx.team.findMany({
          select: { id: true, name: true, shortCode: true },
        });
        const teamIds = new Map(existingTeams.map((team) => [team.name, team.id]));
        const usedCodes = new Set(existingTeams.map((team) => team.shortCode));

        for (const teamName of participantNames) {
          if (teamIds.has(teamName)) continue;
          const created = await tx.team.create({
            data: {
              name: teamName,
              shortCode: nextShortCode(teamName, usedCodes),
              country: "TBC",
              flagSvg: "",
              primaryColor: "#1f2937",
            },
            select: { id: true, name: true },
          });
          teamIds.set(created.name, created.id);
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
              competitionName: competition.name,
              season: competition.year,
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
              competitionName: competition.name,
              season: competition.year,
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
