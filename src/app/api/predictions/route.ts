import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const match = await prisma.match.findUnique({
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
      new Date(match.kickoffTime) <= now
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
            userId: body.userId,
            matchId: body.matchId,
          },
        },
        update: {
          predictedHomeScore:
            body.homeScore,
          predictedAwayScore:
            body.awayScore,
        },
        create: {
          userId: body.userId,
          matchId: body.matchId,
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