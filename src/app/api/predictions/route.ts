import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: body.userId,
          matchId: body.matchId,
        },
      },
      update: {
        predictedHomeScore: body.homeScore,
        predictedAwayScore: body.awayScore,
      },
      create: {
        userId: body.userId,
        matchId: body.matchId,
        predictedHomeScore: body.homeScore,
        predictedAwayScore: body.awayScore,
      },
    });

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to save prediction" },
      { status: 500 }
    );
  }
}