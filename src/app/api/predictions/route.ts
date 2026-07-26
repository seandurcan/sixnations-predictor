import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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

    const now = new Date();

    if (
      new Date(
        match.kickoffTime
      ) <= now
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Predictions are locked because the match has already kicked off",
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