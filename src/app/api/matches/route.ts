import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichMatchesWithLiveScoreInfo, syncLiveScores } from "@/lib/liveScoring";

export const dynamic = "force-dynamic";

export async function GET() {
  await syncLiveScores();

  const matches = await prisma.match.findMany({
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      tournament: {
        select: {
          id: true,
          firstKickoff: true,
          predictionLockAt: true,
        },
      },
    },
  });

  return NextResponse.json(
    await enrichMatchesWithLiveScoreInfo(matches),
    { headers: { "Cache-Control": "no-store" } }
  );
}
