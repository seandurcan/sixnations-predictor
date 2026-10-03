import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ACTIVE_TOURNAMENT_STATUSES,
  VIEWABLE_TOURNAMENT_STATUSES,
  getCurrentViewableTournament,
} from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";
import { sortCompetitionsBySchedule } from "@/lib/competitionOrder";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  const tournaments = await prisma.tournament.findMany({
    where: user
      ? {
          status: { in: [...VIEWABLE_TOURNAMENT_STATUSES] },
          OR: [
            { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
            {
              entries: {
                some: {
                  userId: user.id,
                  status: "ENTERED",
                },
              },
            },
          ],
        }
      : { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
    orderBy: [{ firstKickoff: "asc" }, { year: "asc" }, { id: "asc" }],
  });

  const current = await getCurrentViewableTournament();
  const orderedTournaments = sortCompetitionsBySchedule(tournaments);

  const entries = user && orderedTournaments.length > 0
    ? await prisma.competitionEntry.findMany({
        where: {
          userId: user.id,
          tournamentId: { in: orderedTournaments.map((tournament) => tournament.id) },
        },
        select: {
          tournamentId: true,
          status: true,
          paymentStatus: true,
          predictionsSubmitted: true,
        },
      })
    : [];
  const entryByTournament = new Map(entries.map((entry) => [entry.tournamentId, entry]));

  return NextResponse.json({
    currentTournamentId: current?.id ?? null,
    competitions: orderedTournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      year: tournament.year,
      status: tournament.status,
      entryFee: Number(tournament.entryFee),
      currency: tournament.currency,
      firstKickoff: tournament.firstKickoff?.toISOString() ?? null,
      predictionLockAt: tournament.predictionLockAt?.toISOString() ?? null,
      entry: entryByTournament.get(tournament.id) ?? null,
    })),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
