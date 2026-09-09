import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const TOURNAMENT_ID = 1;
const MATCH_DURATION_MINUTES = 90;

export async function GET() {
  try {
    await requireAdmin();

    const tournament = await prisma.tournament.findUnique({
      where: { id: TOURNAMENT_ID },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          success: false,
          error: `Tournament id=${TOURNAMENT_ID} was not found`,
        },
        { status: 404 }
      );
    }

    const userCount = await prisma.user.count({
      where: { deletedAt: null },
    });

    const verifiedUserCount = await prisma.user.count({
      where: {
        deletedAt: null,
        emailVerified: true,
      },
    });

    // This is deliberately a PLAYER count, not the number of prediction rows.
    // One player with 15 fixture predictions counts once.
    const playersWithPredictions = await prisma.prediction.findMany({
      where: {
        match: {
          tournamentId: TOURNAMENT_ID,
        },
        user: {
          deletedAt: null,
        },
      },
      distinct: ["userId"],
      select: {
        userId: true,
      },
    });

    const predictionCount = playersWithPredictions.length;

    const testScoringSetting =
      await prisma.systemSetting.findUnique({
        where: {
          key: "ADMIN_TEST_SCORING_ACTIVE",
        },
      });

    const tournamentHasStarted =
      new Date() >= new Date(tournament.firstKickoff);

    const testScoringActive =
      testScoringSetting?.value === "true" &&
      !tournamentHasStarted;

    const totalFixtures = await prisma.match.count({
      where: {
        tournamentId: TOURNAMENT_ID,
      },
    });

    // During pre-tournament test scoring, entered scores count immediately
    // so the admin dashboard can be used to exercise all 15 fixtures.
    //
    // Once the real tournament reaches first kickoff, test mode is ignored
    // and a completed dashboard match requires:
    // 1. both final scores entered, and
    // 2. at least 90 minutes elapsed since kickoff.
    const completionCutoff = new Date(
      Date.now() - MATCH_DURATION_MINUTES * 60 * 1000
    );

    const completedFixtures =
      await prisma.match.count({
        where: {
          tournamentId: TOURNAMENT_ID,
          ...(testScoringActive
            ? {}
            : {
                kickoffTime: {
                  lte: completionCutoff,
                },
              }),
          actualHomeScore: {
            not: null,
          },
          actualAwayScore: {
            not: null,
          },
        },
      });

    const remainingFixtures = Math.max(
      0,
      totalFixtures - completedFixtures
    );

    const currentLeader = await prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: [
        { totalPoints: "desc" },
        { cumulativeError: "asc" },
      ],
    });

    const leaderboard = await prisma.user.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: [
        { totalPoints: "desc" },
        { cumulativeError: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalPoints: true,
        exactScores: true,
      },
    });

    const audits = await prisma.scoreAudit.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    const recentAudits = await Promise.all(
      audits.map(async (audit) => {
        const match = await prisma.match.findUnique({
          where: {
            id: audit.matchId,
          },
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        });

        const adminUser = await prisma.user.findUnique({
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
      })
    );

    const winnerRecord = await prisma.tournamentWinner.findFirst({
      where: {
        tournamentId: TOURNAMENT_ID,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let winner = null;

    if (winnerRecord) {
      const winnerUser = await prisma.user.findUnique({
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
        playersWithPredictions: predictionCount,
        completedFixtures,
        remainingFixtures,
        totalFixtures,
        testScoringActive,
      },

      // Backward-compatible aliases prevent an older cached dashboard bundle
      // from rendering zeroes while the new deployment propagates.
      totalUsers: userCount,
      totalMatches: remainingFixtures,
      completedMatches: completedFixtures,
      totalPredictions: predictionCount,

      tournament: {
        id: tournament.id,
        status: tournament.status,
        year: tournament.year,
        name: tournament.name,
      },

      currentLeader: currentLeader
        ? {
            id: currentLeader.id,
            firstName: currentLeader.firstName,
            lastName: currentLeader.lastName,
            totalPoints: currentLeader.totalPoints,
            exactScores: currentLeader.exactScores,
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

    if (message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    if (message === "Admin access required") {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load dashboard",
      },
      { status: 500 }
    );
  }
}
