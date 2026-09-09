import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const tournament = await prisma.tournament.findFirst({ orderBy: { year: "desc" } });
    const locked = tournament ? new Date() >= new Date(tournament.predictionLockAt) : false;

    return NextResponse.json({
      success: true,
      tournamentPointsGuess: user.tournamentPointsGuess,
      predictionLockAt: tournament?.predictionLockAt ?? null,
      locked,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tournament prediction";
    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Authentication required" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const guess = Number(body.tournamentPointsGuess);

    if (!Number.isInteger(guess) || guess < 0) {
      return NextResponse.json(
        { success: false, error: "Enter a valid whole-number tournament points total." },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findFirst({ orderBy: { year: "desc" } });
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    if (new Date() >= new Date(tournament.predictionLockAt)) {
      return NextResponse.json(
        { success: false, error: "Tournament total prediction is locked." },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tournamentPointsGuess: guess },
      select: { tournamentPointsGuess: true },
    });

    return NextResponse.json({ success: true, ...updatedUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save tournament prediction";
    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Authentication required" ? 401 : 500 }
    );
  }
}
