import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireCurrentTournament } from "@/lib/currentTournament";

export async function POST() {
  try {
    await requireAdmin();

    const tournament = await requireCurrentTournament();

    const matches =
      await prisma.match.findMany({
        where: {
          tournamentId:
            tournament.id,
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
            tournament.id,
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
            tournament.id,
        },
      }),

      prisma.tournamentWinner.deleteMany({
        where: {
          tournamentId:
            tournament.id,
        },
      }),

      prisma.tournament.update({
        where: {
          id: tournament.id,
        },
        data: {
          status: "OPEN",
        },
      }),

      prisma.systemSetting.deleteMany({
        where: {
          OR: [
            { key: { startsWith: "LIVE_SCORE_OVERRIDE_" } },
            { key: { startsWith: "LIVE_SCORE_META_" } },
            { key: { startsWith: "LIVE_SCORE_SLOT_" } },
            { key: { startsWith: "LIVE_SCORE_AUDIT_" } },
          ],
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
        tournament.id,
      resetMatches:
        matchIds.length,
      testGamesScored: 0,
      auditHistoryCleared: true,
    });
  } catch (error) {
    console.error(
      "Failed to reset current competition scores:",
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
          "Failed to reset current competition scores.",
      },
      {
        status: 500,
      }
    );
  }
}
