import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignCompetitionRanks } from "@/lib/scoring";
import { createLeaderboardPdf } from "@/lib/leaderboardPdf";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { getCurrentTournament } from "@/lib/currentTournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export async function GET() {
  try {
    const user = await requireUser();

    if (user.deletedAt) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401, headers: privateHeaders },
      );
    }

    const tournament = await getCurrentTournament();
    const [users, latestSnapshot] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          competitionEntries: { some: { tournamentId: tournament?.id ?? -1, status: "ENTERED" } },
        },
        include: { predictions: { where: { match: { tournamentId: tournament?.id ?? -1 } } } },
      }),
      prisma.leaderboardSnapshot.findFirst({
        where: { tournamentId: tournament?.id ?? -1 },
        orderBy: { snapshotNumber: "desc" },
      }),
    ]);

    const snapshots = latestSnapshot
      ? await prisma.leaderboardSnapshot.findMany({
          where: {
            tournamentId: tournament?.id ?? -1,
            snapshotNumber: latestSnapshot.snapshotNumber,
          },
        })
      : [];

    const ranked = assignCompetitionRanks(
      users.map((entrant) => {
        const snapshot = snapshots.find(
          (item) => item.userId === entrant.id,
        );

        return {
          id: entrant.id,
          player:
            [entrant.firstName, entrant.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || "Unknown Player",
          totalPoints: entrant.totalPoints,
          exactScores: entrant.exactScores,
          cumulativeError: entrant.cumulativeError,
          differenceScore: entrant.predictions.reduce(
            (total, prediction) => total + prediction.differenceScore,
            0,
          ),
          correctMargins: entrant.predictions.filter(
            (prediction) => prediction.correctMargin,
          ).length,
          correctResults: entrant.predictions.filter(
            (prediction) => prediction.correctResult,
          ).length,
          movement: snapshot?.rankMovement ?? null,
        };
      }),
    );

    const rows = ranked.map((entrant) => ({
      rank: entrant.rank,
      player: entrant.player,
      totalPoints: entrant.totalPoints,
      correctWins: entrant.correctResults,
      perfectScores: entrant.exactScores,
      correctMargins: entrant.correctMargins,
      predictionDelta: entrant.differenceScore,
      movement: entrant.movement,
    }));

    const tournamentLabel = tournament
      ? formatCompetitionTitle(tournament.name, tournament.year)
      : "Perfect XV";

    const bytes = await createLeaderboardPdf(
      rows,
      tournamentLabel,
    );

    return new Response(new Uint8Array(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="perfect-xv-leaderboard.pdf"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const unauthenticated =
      error instanceof Error &&
      error.message === "Authentication required";

    if (!unauthenticated) {
      console.error("Leaderboard PDF generation failed", error);
    }

    return Response.json(
      {
        error: unauthenticated
          ? "Authentication required"
          : "Unable to generate the leaderboard PDF. Please try again.",
      },
      {
        status: unauthenticated ? 401 : 500,
        headers: privateHeaders,
      },
    );
  }
}
