import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fixturePredictionLockAt } from "@/lib/predictionLocking";

export async function POST(
  request: Request
) {
  try {
    const user =
      await requireUser();

    const body =
      await request.json();

    const match =
      await prisma.match.findUnique({
        where: {
          id: body.matchId,
        },
        include: {
          tournament: {
            select: {
              name: true,
              firstKickoff: true,
              predictionLockAt: true,
            },
          },
        },
      });

    if (!match) {
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

    const competitionEntry = await prisma.competitionEntry.findUnique({
      where: {
        userId_tournamentId: {
          userId: user.id,
          tournamentId: match.tournamentId,
        },
      },
    });

    if (!competitionEntry || competitionEntry.status !== "ENTERED") {
      return NextResponse.json(
        { success: false, error: "You are not currently entered in this competition." },
        { status: 403 }
      );
    }

    if (competitionEntry.paymentStatus !== "COMPLETED") {
      return NextResponse.json(
        { success: false, paymentRequired: true, error: "Competition entry payment is required before making predictions." },
        { status: 402 }
      );
    }

    const predictionLockAt = fixturePredictionLockAt({
      competitionName: match.tournament.name,
      tournamentPredictionLockAt: match.tournament.predictionLockAt,
      kickoffTime: match.kickoffTime,
    });
    if (!predictionLockAt) {
      return NextResponse.json(
        { success: false, error: "This fixture is not open for predictions." },
        { status: 409 }
      );
    }

    const now = new Date();

    if (predictionLockAt <= now) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This prediction is locked because the fixture deadline has passed",
        },
        {
          status: 403,
        }
      );
    }

    const prediction =
      await prisma.prediction.upsert({
        where: {
          userId_matchId: {
            userId: user.id,
            matchId:
              body.matchId,
          },
        },
        update: {
          predictedHomeScore:
            body.homeScore,
          predictedAwayScore:
            body.awayScore,
        },
        create: {
          userId: user.id,
          matchId:
            body.matchId,
          predictedHomeScore:
            body.homeScore,
          predictedAwayScore:
            body.awayScore,
        },
      });

    const tournament = await prisma.tournament.findUnique({
      where: { id: match.tournamentId },
      include: { matches: { select: { id: true } } },
    });
    if (tournament) {
      const predictionCount = await prisma.prediction.count({
        where: {
          userId: user.id,
          matchId: { in: tournament.matches.map((item) => item.id) },
        },
      });
      const completedEntry =
        predictionCount === tournament.matches.length;

      const submittedAt = completedEntry && !user.predictionSubmittedAt ? new Date() : undefined;
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { predictionsSubmitted: completedEntry, predictionSubmittedAt: submittedAt },
        }),
        prisma.competitionEntry.update({
          where: { id: competitionEntry.id },
          data: { predictionsSubmitted: completedEntry, predictionSubmittedAt: submittedAt },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to save prediction";

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

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to save prediction",
      },
      {
        status: 500,
      }
    );
  }
}
