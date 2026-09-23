import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignCompetitionRanks } from "@/lib/scoring";
import { syncLiveScores } from "@/lib/liveScoring";
import { getCurrentTournament } from "@/lib/currentTournament";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await syncLiveScores();
  const tournament = await getCurrentTournament();

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const users = tournament
    ? await prisma.user.findMany({
        where: { deletedAt: null, competitionEntries: { some: { tournamentId: tournament.id, status: "ENTERED" } } },
        include: { predictions: { where: { match: { tournamentId: tournament.id } } } },
      })
    : [];

  const latestSnapshot = await prisma.leaderboardSnapshot.findFirst({
    where: tournament ? { tournamentId: tournament.id } : { tournamentId: -1 },
    orderBy: { snapshotNumber: "desc" },
  });

  const snapshots = latestSnapshot
    ? await prisma.leaderboardSnapshot.findMany({
        where: { tournamentId: tournament?.id ?? -1, snapshotNumber: latestSnapshot.snapshotNumber },
      })
    : [];

  const rankedUsers = assignCompetitionRanks(
    users.map((user) => {
      const snapshot = snapshots.find((item) => item.userId === user.id);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        totalPoints: user.totalPoints,
        exactScores: user.exactScores,
        cumulativeError: user.cumulativeError,
        differenceScore: user.predictions.reduce(
          (total, prediction) => total + prediction.differenceScore,
          0
        ),
        correctMargins: user.predictions.filter((p) => p.correctMargin).length,
        correctResults: user.predictions.filter((p) => p.correctResult).length,
        predictionSubmittedAt: user.predictionSubmittedAt,
        registrationOrder: user.registrationOrder,
        previousRank: snapshot?.previousRank ?? null,
        rankMovement: snapshot?.rankMovement ?? null,
      };
    })
  );

  const totalRecords = rankedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return NextResponse.json(
    {
      page,
      pageSize,
      totalRecords,
      totalPages,
      data: rankedUsers.slice((page - 1) * pageSize, page * pageSize),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
