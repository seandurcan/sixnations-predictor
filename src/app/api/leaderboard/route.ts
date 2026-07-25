import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Number(
    searchParams.get("page") ?? "1"
  );

  const pageSize = Number(
    searchParams.get("pageSize") ?? "10"
  );

  const users = await prisma.user.findMany({
    include: {
      predictions: true,
    },
  });

  const latestSnapshot =
    await prisma.leaderboardSnapshot.findFirst({
      orderBy: {
        snapshotNumber: "desc",
      },
    });

  let latestSnapshots: any[] = [];

  if (latestSnapshot) {
    latestSnapshots =
      await prisma.leaderboardSnapshot.findMany({
        where: {
          snapshotNumber:
            latestSnapshot.snapshotNumber,
        },
      });
  }

  const leaderboard = users
    .map((user) => {
      const differenceScore =
        user.predictions.reduce(
          (total, prediction) =>
            total +
            prediction.differenceScore,
          0
        );

      const snapshot =
        latestSnapshots.find(
          (s) => s.userId === user.id
        );

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        totalPoints: user.totalPoints,
        exactScores: user.exactScores,
        cumulativeError:
          user.cumulativeError,
        differenceScore,
        registrationOrder:
          user.registrationOrder,
        previousRank:
          snapshot?.previousRank ??
          null,
        rankMovement:
          snapshot?.rankMovement ??
          null,
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
    })
    .map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

  const totalRecords =
    leaderboard.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalRecords / pageSize
    )
  );

  const pagedData =
    leaderboard.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  return NextResponse.json({
    page,
    pageSize,
    totalRecords,
    totalPages,
    data: pagedData,
  });
}