import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request = new Request("http://localhost/api/predictions/list")) {
  try {
    const user =
      await requireUser();

    const { searchParams } = new URL(request.url);
    const requestedId = Number(searchParams.get("tournamentId"));

    const predictions =
      await prisma.prediction.findMany({
        where: {
          userId: user.id,
          ...(Number.isInteger(requestedId) && requestedId > 0
            ? { match: { tournamentId: requestedId } }
            : {}),
        },
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

    return NextResponse.json(
      predictions
    );
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load predictions";

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
          "Failed to load predictions",
      },
      {
        status: 500,
      }
    );
  }
}