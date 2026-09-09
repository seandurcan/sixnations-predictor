import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assignCompetitionRanks,
  calculateMatchScore,
} from "@/lib/scoring";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const existingMatch =
      await prisma.match.findUnique({
        where: {
          id: body.matchId,
        },
      });

    if (!existingMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.scoreAudit.create({
      data: {
        matchId: existingMatch.id,
        previousHome:
          existingMatch.actualHomeScore,
        previousAway:
          existingMatch.actualAwayScore,
        newHome: body.homeScore,
        newAway: body.awayScore,

        // Replace with real admin id later
        adminUserId: 1,
      },
    });

    const match =
      await prisma.match.update({
        where: {
          id: body.matchId,
        },
        data: {
          actualHomeScore:
            body.homeScore,
          actualAwayScore:
            body.awayScore,
          completed: true,
        },
      });

    const predictions =
      await prisma.prediction.findMany({
        where: {
          matchId: body.matchId,
        },
      });

    for (const prediction of predictions) {
      const score = calculateMatchScore(
        prediction.predictedHomeScore,
        prediction.predictedAwayScore,
        body.homeScore,
        body.awayScore
      );

      await prisma.prediction.update({
        where: {
          id: prediction.id,
        },
        data: {
          pointsAwarded: score.pointsAwarded,
          errorValue: score.errorValue,
          exactScore: score.exactScore,
          correctMargin: score.correctMargin,
          correctResult: score.correctResult,
          differenceScore: score.differenceScore,
        },
      });
    }

    const users =
      await prisma.user.findMany({
        include: {
          predictions: true,
        },
      });

    for (const user of users) {
      const totalPoints =
        user.predictions.reduce(
          (
            total,
            prediction
          ) =>
            total +
            prediction.pointsAwarded,
          0
        );

      const cumulativeError =
        user.predictions.reduce(
          (
            total,
            prediction
          ) =>
            total +
            prediction.errorValue,
          0
        );

      const exactScores =
        user.predictions.filter(
          (prediction) =>
            prediction.exactScore
        ).length;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          totalPoints,
          cumulativeError,
          exactScores,
        },
      });
    }

    const latestSnapshot =
      await prisma.leaderboardSnapshot.findFirst(
        {
          orderBy: {
            snapshotNumber:
              "desc",
          },
        }
      );

    const snapshotNumber =
      (latestSnapshot?.snapshotNumber ??
        0) + 1;

    const refreshedUsers =
      await prisma.user.findMany({
        include: {
          predictions: true,
        },
      });

    const completedMatches =
      await prisma.match.count({
        where: {
          completed: true,
          tournamentId: match.tournamentId,
        },
      });

    const totalMatches =
      await prisma.match.count({ where: { tournamentId: match.tournamentId } });

    const tournamentComplete = totalMatches > 0 && completedMatches === totalMatches;

    const rankings = assignCompetitionRanks(
      refreshedUsers.map((user) => {
          const differenceScore =
            user.predictions.reduce(
              (
                total,
                prediction
              ) =>
                total +
                prediction.differenceScore,
              0
            );

          return {
            id: user.id,
            totalPoints:
              user.totalPoints,
            exactScores:
              user.exactScores,
            cumulativeError:
              user.cumulativeError,
            differenceScore,
            correctMargins: user.predictions.filter((prediction) => prediction.correctMargin).length,
            correctResults: user.predictions.filter((prediction) => prediction.correctResult).length,
            predictionSubmittedAt: user.predictionSubmittedAt,
            registrationOrder:
              user.registrationOrder,
          };
        })
    );

    const previousSnapshots =
      latestSnapshot
        ? await prisma.leaderboardSnapshot.findMany(
            {
              where: {
                snapshotNumber:
                  latestSnapshot.snapshotNumber,
              },
            }
          )
        : [];

    for (
      let index = 0;
      index < rankings.length;
      index++
    ) {
      const user =
        rankings[index];

      const rank = user.rank;

      const previousSnapshot =
        previousSnapshots.find(
          (
            snapshot
          ) =>
            snapshot.userId ===
            user.id
        );

      const previousRank =
        previousSnapshot?.rank ??
        null;

      let rankMovement =
        null;

      if (
        previousRank !==
        null
      ) {
        rankMovement =
          previousRank -
          rank;
      }

      await prisma.leaderboardSnapshot.create(
        {
          data: {
            tournamentId: match.tournamentId,
            userId: user.id,
            snapshotNumber,
            rank,
            previousRank,
            rankMovement,
            totalPoints:
              user.totalPoints,
            cumulativeError:
              user.cumulativeError,
            exactScores:
              user.exactScores,
            correctMargins: user.correctMargins,
            correctResults: user.correctResults,
          },
        }
      );
    }

    if (tournamentComplete) {
      await prisma.tournament.update({
        where: {
          id: match.tournamentId,
        },
        data: {
          status:
            "COMPLETED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      snapshotNumber,
      match,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to save result",
      },
      {
        status: 500,
      }
    );
  }
}
