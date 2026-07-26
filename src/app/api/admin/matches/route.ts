import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const matches =
      await prisma.match.findMany({
        orderBy: {
          matchNumber: "asc",
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

    return NextResponse.json(
      matches
    );
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Access denied";

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

    if (
      message ===
      "Admin access required"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load matches",
      },
      {
        status: 500,
      }
    );
  }
}