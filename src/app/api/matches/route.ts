import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: {
      matchNumber: "asc",
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      tournament: {
        select: {
          id: true,
          predictionLockAt: true,
        },
      },
    },
  });

  return NextResponse.json(matches);
}