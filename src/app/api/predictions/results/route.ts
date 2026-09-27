import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assignCompetitionRanks } from "@/lib/scoring";
import { VIEWABLE_TOURNAMENT_STATUSES } from "@/lib/currentTournament";

export const dynamic = "force-dynamic";

type Ranked = {
  id: number;
  totalPoints: number;
  cumulativeError: number;
  exactScores: number;
  correctMargins: number;
  correctResults: number;
  differenceScore: number;
  tournamentPointsGuessError?: number | null;
};

function rankUsers(
  users: Array<{
    id: number;
    tournamentPointsGuess: number | null;
    predictions: Array<{
      matchId: number;
      pointsAwarded: number;
      errorValue: number;
      exactScore: boolean;
      correctMargin: boolean;
      correctResult: boolean;
      differenceScore: number;
    }>;
  }>,
  matchIds: Set<number>,
  actualTournamentPoints: number | null
) {
  const rows: Ranked[] = users.map((user) => {
    const predictions = user.predictions.filter((prediction) => matchIds.has(prediction.matchId));
    return {
      id: user.id,
      totalPoints: predictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0),
      cumulativeError: predictions.reduce(
        (sum, prediction) => sum + prediction.errorValue,
        0
      ),
      exactScores: predictions.filter((prediction) => prediction.exactScore).length,
      correctMargins: predictions.filter((prediction) => prediction.correctMargin).length,
      correctResults: predictions.filter((prediction) => prediction.correctResult).length,
      differenceScore: predictions.reduce((sum, prediction) => sum + prediction.differenceScore, 0),
      tournamentPointsGuessError:
        actualTournamentPoints !== null && user.tournamentPointsGuess !== null
          ? Math.abs(user.tournamentPointsGuess - actualTournamentPoints)
          : null,
    };
  });
  return assignCompetitionRanks(rows);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const tournamentId = Number(searchParams.get("tournamentId"));

    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return NextResponse.json({ success: false, error: "Select a valid competition." }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        status: { in: [...VIEWABLE_TOURNAMENT_STATUSES] },
      },
      select: {
        id: true,
        name: true,
        year: true,
        status: true,
        _count: { select: { matches: true } },
      },
    });
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Competition not available." }, { status: 404 });
    }

    const entry = await prisma.competitionEntry.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
      select: {
        status: true,
        paymentStatus: true,
        tournamentPointsGuess: true,
      },
    });
    if (!entry || entry.status !== "ENTERED") {
      return NextResponse.json({ success: false, error: "You are not entered in this competition." }, { status: 403 });
    }

    const completedMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        completed: true,
        actualHomeScore: { not: null },
        actualAwayScore: { not: null },
      },
      include: {
        homeTeam: { select: { name: true, shortCode: true } },
        awayTeam: { select: { name: true, shortCode: true } },
      },
      orderBy: [{ kickoffTime: "asc" }, { matchNumber: "asc" }],
    });

    const completedIds = new Set(completedMatches.map((match) => match.id));
    const userPredictions = await prisma.prediction.findMany({
      where: { userId: user.id, matchId: { in: [...completedIds] } },
      orderBy: { match: { kickoffTime: "asc" } },
    });
    const predictionByMatch = new Map(userPredictions.map((prediction) => [prediction.matchId, prediction]));

    const entrants = await prisma.user.findMany({
      where: {
        deletedAt: null,
        competitionEntries: {
          some: { tournamentId, status: "ENTERED" },
        },
      },
      select: {
        id: true,
        competitionEntries: {
          where: { tournamentId },
          select: { tournamentPointsGuess: true },
          take: 1,
        },
        predictions: {
          where: { matchId: { in: [...completedIds] } },
          select: {
            matchId: true,
            pointsAwarded: true,
            errorValue: true,
            exactScore: true,
            correctMargin: true,
            correctResult: true,
            differenceScore: true,
          },
        },
      },
    });

    const competitionComplete =
      tournament._count.matches > 0 &&
      completedMatches.length === tournament._count.matches;
    const actualTournamentPoints = competitionComplete
      ? completedMatches.reduce(
          (total, match) =>
            total +
            (match.actualHomeScore ?? 0) +
            (match.actualAwayScore ?? 0),
          0
        )
      : null;

    const rankedEntrants = entrants.map((entrant) => ({
      id: entrant.id,
      tournamentPointsGuess:
        entrant.competitionEntries[0]?.tournamentPointsGuess ?? null,
      predictions: entrant.predictions,
    }));

    const currentRanks = rankUsers(
      rankedEntrants,
      completedIds,
      actualTournamentPoints
    );
    const currentUserRank = currentRanks.find((row) => row.id === user.id)?.rank ?? null;

    const latestCompleted = [...completedMatches].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )[0] ?? null;

    let previousRank: number | null = null;
    if (latestCompleted && completedMatches.length > 1) {
      const previousIds = new Set([...completedIds].filter((id) => id !== latestCompleted.id));
      previousRank = rankUsers(
        rankedEntrants,
        previousIds,
        null
      ).find((row) => row.id === user.id)?.rank ?? null;
    }

    const totalPoints = userPredictions.reduce(
      (sum, prediction) => sum + prediction.pointsAwarded,
      0
    );

    return NextResponse.json({
      success: true,
      tournament,
      totalPoints,
      leaderboardPosition: currentUserRank,
      previousLeaderboardPosition: previousRank,
      rankMovement:
        currentUserRank !== null && previousRank !== null
          ? previousRank - currentUserRank
          : null,
      latestCompletedMatchId: latestCompleted?.id ?? null,
      matches: completedMatches.map((match) => {
        const prediction = predictionByMatch.get(match.id) ?? null;
        return {
          id: match.id,
          matchNumber: match.matchNumber,
          round: match.round,
          kickoffTime: match.kickoffTime,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          actualHomeScore: match.actualHomeScore,
          actualAwayScore: match.actualAwayScore,
          prediction: prediction
            ? {
                predictedHomeScore: prediction.predictedHomeScore,
                predictedAwayScore: prediction.predictedAwayScore,
                pointsAwarded: prediction.pointsAwarded,
                correctResult: prediction.correctResult,
                correctMargin: prediction.correctMargin,
                exactScore: prediction.exactScore,
                errorValue: prediction.errorValue,
                differenceScore: prediction.differenceScore,
              }
            : null,
        };
      }),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load completed match results.";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
