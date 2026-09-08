import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tournamentPointsGuess: true },
    });
    return NextResponse.json({ success: true, ...current });
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const tournamentPointsGuess = Number(body.tournamentPointsGuess);

    if (
      !Number.isInteger(tournamentPointsGuess) ||
      tournamentPointsGuess < 0
    ) {
      return NextResponse.json(
        { success: false, error: "Enter valid whole-number tie-break predictions." },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findFirst({
      where: { status: { in: ["OPEN", "LOCKED"] } },
      orderBy: { firstKickoff: "asc" },
      include: { matches: { select: { id: true } } },
    });

    if (!tournament || new Date() >= tournament.predictionLockAt) {
      return NextResponse.json(
        { success: false, error: "Tournament tie-break predictions are locked." },
        { status: 403 }
      );
    }

    const predictionCount = await prisma.prediction.count({
      where: {
        userId: user.id,
        matchId: { in: tournament.matches.map((match) => match.id) },
      },
    });
    const completedEntry = predictionCount === tournament.matches.length;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        tournamentPointsGuess,
        predictionsSubmitted: completedEntry,
        predictionSubmittedAt:
          completedEntry && !user.predictionSubmittedAt ? new Date() : undefined,
      },
      select: { tournamentPointsGuess: true },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save tie-break predictions.";
    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Authentication required" ? 401 : 500 }
    );
  }
}
