import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichMatchesWithLiveScoreInfo, syncLiveScores } from "@/lib/liveScoring";
import { getTournamentByIdOrCurrent } from "@/lib/currentTournament";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await syncLiveScores();
  const { searchParams } = new URL(request.url);
  const requestedId = Number(searchParams.get("tournamentId"));
  const tournament = await getTournamentByIdOrCurrent(
    Number.isInteger(requestedId) && requestedId > 0 ? requestedId : null
  );

  if (!tournament) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }

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
          firstKickoff: true,
          predictionLockAt: true,
        },
      },
    },
  });

  return NextResponse.json(
    await enrichMatchesWithLiveScoreInfo(matches),
    { headers: { "Cache-Control": "no-store" } }
  );
}
