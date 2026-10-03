import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireCurrentViewableTournament } from "@/lib/currentTournament";
import { COMPETITION_STORY_PREFIX } from "@/lib/competitionStories";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const requestedId = Number(body.tournamentId);

    const tournament =
      Number.isInteger(requestedId) && requestedId > 0
        ? await prisma.tournament.findUnique({ where: { id: requestedId } })
        : await requireCurrentViewableTournament();

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    if (tournament.status === "ARCHIVED" || tournament.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "Archived or cancelled competitions cannot be reset." },
        { status: 409 }
      );
    }

    const matches = await prisma.match.findMany({
      where: { tournamentId: tournament.id },
      select: { id: true },
    });
    const matchIds = matches.map((match) => match.id);

    const scoreAudits = matchIds.length
      ? await prisma.scoreAudit.findMany({
          where: { matchId: { in: matchIds } },
          select: { id: true },
        })
      : [];
    const scoreAuditSettingKeys = scoreAudits.map(
      (audit) => "LIVE_SCORE_AUDIT_" + audit.id
    );
    const liveScoreSettingKeys = matchIds.flatMap((matchId) => [
      "LIVE_SCORE_OVERRIDE_" + matchId,
      "LIVE_SCORE_META_" + matchId,
      "LIVE_SCORE_SLOT_" + matchId,
    ]);

    const nextTournamentStatus =
      tournament.status === "COMPLETED" ||
      tournament.status === "LOCKED" ||
      tournament.status === "IN_PROGRESS"
        ? "OPEN"
        : tournament.status;

    const resetResult = await prisma.$transaction(async (tx) => {
      await tx.scoreAudit.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      await tx.match.updateMany({
        where: { tournamentId: tournament.id },
        data: {
          actualHomeScore: null,
          actualAwayScore: null,
          completed: false,
        },
      });

      await tx.prediction.updateMany({
        where: { matchId: { in: matchIds } },
        data: {
          pointsAwarded: 0,
          errorValue: 0,
          differenceScore: 0,
          exactScore: false,
          correctMargin: false,
          correctResult: false,
        },
      });

      await tx.competitionEntry.updateMany({
        where: { tournamentId: tournament.id },
        data: {
          totalPoints: 0,
          cumulativeError: 0,
          exactScores: 0,
        },
      });

      await tx.leaderboardSnapshot.deleteMany({
        where: { tournamentId: tournament.id },
      });

      await tx.tournamentWinner.deleteMany({
        where: { tournamentId: tournament.id },
      });

      const newsReset = await tx.systemSetting.deleteMany({
        where: {
          key: {
            startsWith: COMPETITION_STORY_PREFIX + tournament.id + "_",
          },
        },
      });

      if (nextTournamentStatus !== tournament.status) {
        await tx.tournament.update({
          where: { id: tournament.id },
          data: { status: nextTournamentStatus },
        });
      }

      if (liveScoreSettingKeys.length || scoreAuditSettingKeys.length) {
        await tx.systemSetting.deleteMany({
          where: {
            key: { in: [...liveScoreSettingKeys, ...scoreAuditSettingKeys] },
          },
        });
      }

      await tx.systemSetting.upsert({
        where: { key: "ADMIN_TEST_SCORING_ACTIVE" },
        update: { value: "false" },
        create: {
          key: "ADMIN_TEST_SCORING_ACTIVE",
          value: "false",
        },
      });

      return {
        newsStoriesRemoved: newsReset.count,
      };
    });

    return NextResponse.json({
      success: true,
      tournamentId: tournament.id,
      resetMatches: matchIds.length,
      testGamesScored: 0,
      auditHistoryCleared: true,
      roundNewsReset: true,
      newsStoriesRemoved: resetResult.newsStoriesRemoved,
    });
  } catch (error) {
    console.error("Failed to reset competition scores:", error);

    const message =
      error instanceof Error ? error.message : "Failed to reset scores";

    if (message === "Authentication required") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (message === "Admin access required") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to reset selected competition scores." },
      { status: 500 }
    );
  }
}
