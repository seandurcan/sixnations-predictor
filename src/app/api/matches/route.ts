import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichMatchesWithLiveScoreInfo, syncLiveScores } from "@/lib/liveScoring";
import { getViewableTournamentByIdOrCurrent } from "@/lib/currentTournament";
import { fixturePredictionLockAt } from "@/lib/predictionLocking";

export const dynamic = "force-dynamic";

export async function GET(request: Request = new Request("http://localhost/api/matches")) {
  await syncLiveScores();
  const { searchParams } = new URL(request.url);
  const requestedId = Number(searchParams.get("tournamentId"));
  const tournament = await getViewableTournamentByIdOrCurrent(
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

  const enriched = await enrichMatchesWithLiveScoreInfo(matches);
  const stageFixtures = matches.map((match) => ({
    round: match.round,
    kickoffTime: match.kickoffTime,
  }));
  return NextResponse.json(
    enriched.map((match) => ({
      ...match,
      predictionLockAt: fixturePredictionLockAt({
        competitionName: match.tournament.name,
        tournamentPredictionLockAt: match.tournament.predictionLockAt,
        kickoffTime: match.kickoffTime,
        matchRound: match.round,
        tournamentMatches: stageFixtures,
      })?.toISOString() ?? null,
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}
