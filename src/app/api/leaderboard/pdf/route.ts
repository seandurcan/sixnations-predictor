import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignCompetitionRanks } from "@/lib/scoring";
import { createLeaderboardPdf } from "@/lib/leaderboardPdf";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { getViewableTournamentByIdOrCurrent } from "@/lib/currentTournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

function safeFilename(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug ? `perfect-xv-${slug}-leaderboard.pdf` : "perfect-xv-leaderboard.pdf";
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    if (user.deletedAt) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401, headers: privateHeaders },
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedId = Number(searchParams.get("tournamentId"));
    const tournament = await getViewableTournamentByIdOrCurrent(
      Number.isInteger(requestedId) && requestedId > 0
        ? requestedId
        : null,
    );

    if (!tournament) {
      return Response.json(
        { error: "No leaderboard competition is available." },
        { status: 404, headers: privateHeaders },
      );
    }

    const [users, latestSnapshot] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          competitionEntries: {
            some: {
              tournamentId: tournament.id,
              status: "ENTERED",
            },
          },
        },
        include: {
          predictions: {
            where: {
              match: {
                tournamentId: tournament.id,
                completed: true,
              },
            },
          },
          competitionEntries: {
            where: { tournamentId: tournament.id },
            take: 1,
          },
        },
      }),
      prisma.leaderboardSnapshot.findFirst({
        where: { tournamentId: tournament.id },
        orderBy: { snapshotNumber: "desc" },
      }),
    ]);

    const snapshots = latestSnapshot
      ? await prisma.leaderboardSnapshot.findMany({
          where: {
            tournamentId: tournament.id,
            snapshotNumber: latestSnapshot.snapshotNumber,
          },
        })
      : [];

    const ranked = assignCompetitionRanks(
      users.map((entrant) => {
        const snapshot = snapshots.find(
          (item) => item.userId === entrant.id,
        );

        const totalPoints = entrant.predictions.reduce(
          (total, prediction) => total + prediction.pointsAwarded,
          0,
        );
        const exactScores = entrant.predictions.filter(
          (prediction) => prediction.exactScore,
        ).length;
        const cumulativeError = entrant.predictions.reduce(
          (total, prediction) => total + prediction.errorValue,
          0,
        );
        const differenceScore = entrant.predictions.reduce(
          (total, prediction) => total + prediction.differenceScore,
          0,
        );
        const correctMargins = entrant.predictions.filter(
          (prediction) => prediction.correctMargin,
        ).length;
        const correctResults = entrant.predictions.filter(
          (prediction) => prediction.correctResult,
        ).length;

        return {
          id: entrant.id,
          player:
            [entrant.firstName, entrant.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || "Unknown Player",
          totalPoints,
          exactScores,
          cumulativeError,
          differenceScore,
          correctMargins,
          correctResults,
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

    const tournamentLabel = formatCompetitionTitle(
      tournament.name,
      tournament.year,
    );

    const bytes = await createLeaderboardPdf(
      rows,
      tournamentLabel,
    );

    const filename = safeFilename(tournamentLabel);

    return new Response(new Uint8Array(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.length),
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
