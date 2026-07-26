import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const userCount =
      await prisma.user.count();

    const verifiedUserCount =
      await prisma.user.count({
        where: {
          emailVerified: true,
        },
      });

    const predictionCount =
      await prisma.prediction.count();

    const completedFixtures =
      await prisma.match.count({
        where: {
          completed: true,
        },
      });

    const totalFixtures =
      await prisma.match.count();

    const remainingFixtures =
      totalFixtures -
      completedFixtures;

    const tournament =
      await prisma.tournament.findFirst({
        orderBy: {
          id: "desc",
        },
      });

    const currentLeader =
      await prisma.user.findFirst({
        orderBy: [
          {
            totalPoints: "desc",
          },
          {
            cumulativeError: "asc",
          },
        ],
      });

    const leaderboard =
      await prisma.user.findMany({
        take: 10,
        orderBy: [
          {
            totalPoints: "desc",
          },
          {
            cumulativeError: "asc",
          },
        ],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          totalPoints: true,
          exactScores: true,
        },
      });

    const audits =
      await prisma.scoreAudit.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

    const recentAudits =
      await Promise.all(
        audits.map(
          async (audit) => {
            const match =
              await prisma.match.findUnique({
                where: {
                  id: audit.matchId,
                },
                include: {
                  homeTeam: true,
                  awayTeam: true,
                },
              });

            const adminUser =
              await prisma.user.findUnique({
                where: {
                  id: audit.adminUserId,
                },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              });

            return {
              ...audit,
              match,
              adminUser,
            };
          }
        )
      );

    const winnerRecord =
      await prisma.tournamentWinner.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

    let winner = null;

    if (winnerRecord) {
      const winnerUser =
        await prisma.user.findUnique({
          where: {
            id: winnerRecord.userId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

      winner = {
        ...winnerRecord,
        user: winnerUser,
      };
    }

    return NextResponse.json({
      success: true,

      metrics: {
        userCount,
        verifiedUserCount,
        predictionCount,
        completedFixtures,
        remainingFixtures,
        totalFixtures,
      },

      tournament: {
        status:
          tournament?.status ??
          "UNKNOWN",

        year:
          tournament?.year ??
          null,

        name:
          tournament?.name ??
          null,
      },

      currentLeader: currentLeader
        ? {
            id:
              currentLeader.id,
            firstName:
              currentLeader.firstName,
            lastName:
              currentLeader.lastName,
            totalPoints:
              currentLeader.totalPoints,
            exactScores:
              currentLeader.exactScores,
          }
        : null,

      leaderboard,

      winner,

      recentAudits,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard";

    if (
      message ===
      "Authentication required"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    if (
      message ===
      "Admin access required"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load dashboard",
      },
      {
        status: 500,
      }
    );
  }
}