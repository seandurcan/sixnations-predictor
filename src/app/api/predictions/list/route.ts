import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const predictions = await prisma.prediction.findMany({
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: {
      matchId: "asc",
    },
  });

  return NextResponse.json(predictions);
}
