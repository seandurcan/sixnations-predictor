import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveTournaments, getCurrentTournament } from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tournaments, current, user] = await Promise.all([
    getActiveTournaments(),
    getCurrentTournament(),
    getCurrentUser(),
  ]);

  const entries = user && tournaments.length > 0
    ? await prisma.competitionEntry.findMany({
        where: {
          userId: user.id,
          tournamentId: { in: tournaments.map((tournament) => tournament.id) },
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
    competitions: tournaments.map((tournament) => ({
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
