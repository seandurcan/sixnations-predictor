import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getWinner(home: number, away: number) {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const match = await prisma.match.update({
      where: {
        id: body.matchId,
      },
      data: {
        actualHomeScore: body.homeScore,
        actualAwayScore: body.awayScore,
        completed: true,
      },
    });

    const predictions =
      await prisma.prediction.findMany({
        where: {
          matchId: body.matchId,
        },
      });

    const actualWinner = getWinner(
      body.homeScore,
      body.awayScore
    );

    const actualDifference =
      body.homeScore - body.awayScore;

    for (const prediction of predictions) {
      let pointsAwarded = 0;

      const predictedWinner =
        getWinner(
          prediction.predictedHomeScore,
          prediction.predictedAwayScore
        );

      if (
        predictedWinner === actualWinner
      ) {
        pointsAwarded += 3;
      }

      const exactScore =
        prediction.predictedHomeScore ===
          body.homeScore &&
        prediction.predictedAwayScore ===
          body.awayScore;

      if (exactScore) {
        pointsAwarded += 10;
      }

      const errorValue =
        Math.abs(
          prediction.predictedHomeScore -
            body.homeScore
        ) +
        Math.abs(
          prediction.predictedAwayScore -
            body.awayScore
        );

      const predictedDifference =
        prediction.predictedHomeScore -
        prediction.predictedAwayScore;

      const differenceGap =
        Math.abs(
          predictedDifference -
            actualDifference
        );

      let differenceScore =
        differenceGap;

      if (
        predictedWinner === actualWinner
      ) {
        differenceScore =
          -differenceGap;
      }

      await prisma.prediction.update({
        where: {
          id: prediction.id,
        },
        data: {
          pointsAwarded,
          errorValue,
          exactScore,
          differenceScore,
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
          (total, prediction) =>
            total +
            prediction.pointsAwarded,
          0
        );

      const cumulativeError =
        user.predictions.reduce(
          (total, prediction) =>
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
      await prisma.leaderboardSnapshot.findFirst({
        orderBy: {
          snapshotNumber: "desc",
        },
      });

    const snapshotNumber =
      (latestSnapshot?.snapshotNumber ??
        0) + 1;

    const refreshedUsers =
      await prisma.user.findMany({
        include: {
          predictions: true,
        },
      });

    const rankings =
      refreshedUsers
        .map((user) => {
          const differenceScore =
            user.predictions.reduce(
              (total, prediction) =>
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
            registrationOrder:
              user.registrationOrder,
          };
        })
        .sort((a, b) => {
          if (
            b.totalPoints !==
            a.totalPoints
          ) {
            return (
              b.totalPoints -
              a.totalPoints
            );
          }

          if (
            a.differenceScore !==
            b.differenceScore
          ) {
            return (
              a.differenceScore -
              b.differenceScore
            );
          }

          if (
            b.exactScores !==
            a.exactScores
          ) {
            return (
              b.exactScores -
              a.exactScores
            );
          }

          if (
            a.cumulativeError !==
            b.cumulativeError
          ) {
            return (
              a.cumulativeError -
              b.cumulativeError
            );
          }

          return (
            a.registrationOrder -
            b.registrationOrder
          );
        });

    const previousSnapshots =
      latestSnapshot
        ? await prisma.leaderboardSnapshot.findMany({
            where: {
              snapshotNumber:
                latestSnapshot.snapshotNumber,
            },
          })
        : [];

    for (
      let index = 0;
      index < rankings.length;
      index++
    ) {
      const user =
        rankings[index];

      const rank = index + 1;

      const previousSnapshot =
        previousSnapshots.find(
          (snapshot) =>
            snapshot.userId ===
            user.id
        );

      const previousRank =
        previousSnapshot?.rank ??
        null;

      let rankMovement =
        null;

      if (
        previousRank !== null
      ) {
        rankMovement =
          previousRank - rank;
      }

      await prisma.leaderboardSnapshot.create({
        data: {
          tournamentId: 1,
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
        error:
          "Failed to save result",
      },
      {
        status: 500,
      }
    );
  }
}