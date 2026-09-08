import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function randomScore() {
  return Math.floor(Math.random() * 41);
}

export async function POST() {
  try {
    const user = await requireUser();
    const now = new Date();
    const tournament = await prisma.tournament.findFirst({
      where: {
        status: { in: ["OPEN", "LOCKED"] },
        firstKickoff: { gt: now },
      },
      orderBy: { firstKickoff: "asc" },
      include: { matches: { orderBy: { kickoffTime: "asc" } } },
    });

    if (!tournament || tournament.matches.length === 0) {
      return NextResponse.json(
        { success: false, error: "No open tournament is available for Quick Pick." },
        { status: 409 }
      );
    }

    const openMatches = tournament.matches.filter(
      (match) => !match.completed && match.kickoffTime > now
    );

    if (openMatches.length === 0) {
      return NextResponse.json(
        { success: false, error: "All tournament fixtures are locked." },
        { status: 403 }
      );
    }

    const picks = openMatches.map((match) => ({
      matchId: match.id,
      homeScore: randomScore(),
      awayScore: randomScore(),
    }));
    await prisma.$transaction([
      ...picks.map((pick) =>
        prisma.prediction.upsert({
          where: { userId_matchId: { userId: user.id, matchId: pick.matchId } },
          update: {
            predictedHomeScore: pick.homeScore,
            predictedAwayScore: pick.awayScore,
          },
          create: {
            userId: user.id,
            matchId: pick.matchId,
            predictedHomeScore: pick.homeScore,
            predictedAwayScore: pick.awayScore,
          },
        })
      ),
      prisma.user.update({
        where: { id: user.id },
        data: {
          predictionsSubmitted: openMatches.length === tournament.matches.length,
          predictionSubmittedAt:
            openMatches.length === tournament.matches.length && !user.predictionSubmittedAt
              ? new Date()
              : undefined,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      saved: picks.length,
    });
  } catch (error) {
    console.error("Quick Pick failed:", error);
    const message = error instanceof Error ? error.message : "Quick Pick failed";

    if (message === "Authentication required") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Quick Pick failed. Please try again." },
      { status: 500 }
    );
  }
}
