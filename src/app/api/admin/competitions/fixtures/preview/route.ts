import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { discoverCompetitionFixtures } from "@/lib/fixtureDiscovery";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => ({}));
  const tournamentId = Number(body.tournamentId);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid draft competition." },
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
  if (competition.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Fixture discovery is limited to draft competitions." },
      { status: 409 }
    );
  }
  if (competition._count.matches > 0) {
    return NextResponse.json(
      { success: false, error: "This draft already contains fixtures. Nothing was changed." },
      { status: 409 }
    );
  }

  const apiKey =
    process.env.API_SPORTS_KEY ??
    process.env.APISPORTS_RUGBY_KEY ??
    process.env.API_RUGBY_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API-Sports is not configured for fixture discovery." },
      { status: 503 }
    );
  }

  try {
    const preview = await discoverCompetitionFixtures(competition.name, competition.year, apiKey);
    return NextResponse.json({
      success: true,
      competition: { id: competition.id, name: competition.name, year: competition.year },
      preview,
      persisted: false,
    });
  } catch (error) {
    console.error("Fixture discovery failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Fixture discovery failed.",
      },
      { status: 502 }
    );
  }
}

