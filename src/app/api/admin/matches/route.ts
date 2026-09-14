import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { enrichMatchesWithLiveScoreInfo, syncLiveScores } from "@/lib/liveScoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await syncLiveScores();

    const matches = await prisma.match.findMany({
      orderBy: { matchNumber: "asc" },
      include: { homeTeam: true, awayTeam: true },
    });

    return NextResponse.json(
      await enrichMatchesWithLiveScoreInfo(matches),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Access denied";

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
      { success: false, error: "Failed to load matches" },
      { status: 500 }
    );
  }
}
