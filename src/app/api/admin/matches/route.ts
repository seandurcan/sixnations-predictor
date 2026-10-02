import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enrichMatchesWithLiveScoreInfo, syncLiveScores } from "@/lib/liveScoring";
import { requireCurrentViewableTournament } from "@/lib/currentTournament";

export const dynamic = "force-dynamic";

export async function GET(request?: Request) {
  try {
    await requireAdmin();

    const requestedId = request
      ? Number(new URL(request.url).searchParams.get("tournamentId"))
      : NaN;

    const tournament =
      Number.isInteger(requestedId) && requestedId > 0
        ? await prisma.tournament.findUnique({ where: { id: requestedId } })
        : await requireCurrentViewableTournament();

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    await syncLiveScores();

    const matches = await prisma.match.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { matchNumber: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: {
          select: {
            id: true,
            name: true,
            year: true,
            status: true,
            firstKickoff: true,
          },
        },
      },
    });

    return NextResponse.json(
      await enrichMatchesWithLiveScoreInfo(matches),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Access denied";

    if (message === "Authentication required") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (message === "Admin access required") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to load matches" },
      { status: 500 }
    );
  }
}
