import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const TOURNAMENT_ID = 1;

export async function POST() {
  try {
    await requireAdmin();

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: TOURNAMENT_ID,
        },
        select: {
          id: true,
        },
      });

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tournament 1 was not found.",
        },
        {
          status: 404,
        }
      );
    }

    const matches =
      await prisma.match.findMany({
        where: {
          tournamentId:
            TOURNAMENT_ID,
        },
        select: {
          id: true,
        },
      });

    const matchIds =
      matches.map(
        (match) => match.id
      );

    await prisma.$transaction([
      prisma.scoreAudit.deleteMany({
        where: {
          matchId: {
            in: matchIds,
          },
        },
      }),

      prisma.match.updateMany({
        where: {
          tournamentId:
            TOURNAMENT_ID,
        },
        data: {
          actualHomeScore: null,
          actualAwayScore: null,
          completed: false,
        },
      }),

      prisma.prediction.updateMany({
        where: {
          matchId: {
            in: matchIds,
          },
        },
        data: {
          pointsAwarded: 0,
          errorValue: 0,
          differenceScore: 0,
          exactScore: false,
          correctMargin: false,
          correctResult: false,
        },
      }),

      prisma.user.updateMany({
        data: {
          totalPoints: 0,
          cumulativeError: 0,
          exactScores: 0,
        },
      }),

      prisma.leaderboardSnapshot.deleteMany({
        where: {
          tournamentId:
            TOURNAMENT_ID,
        },
      }),

      prisma.tournamentWinner.deleteMany({
        where: {
          tournamentId:
            TOURNAMENT_ID,
        },
      }),

      prisma.tournament.update({
        where: {
          id: TOURNAMENT_ID,
        },
        data: {
          status: "OPEN",
        },
      }),

      prisma.systemSetting.upsert({
        where: {
          key: "ADMIN_TEST_SCORING_ACTIVE",
        },
        update: {
          value: "false",
        },
        create: {
          key: "ADMIN_TEST_SCORING_ACTIVE",
          value: "false",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tournamentId:
        TOURNAMENT_ID,
      resetMatches:
        matchIds.length,
      testGamesScored: 0,
      auditHistoryCleared: true,
    });
  } catch (error) {
    console.error(
      "Failed to reset Tournament 1 scores:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to reset scores";

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
          "Failed to reset Tournament 1 scores.",
      },
      {
        status: 500,
      }
    );
  }
}
