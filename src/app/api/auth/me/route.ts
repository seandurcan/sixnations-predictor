import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          firstName:
            user.firstName,
          lastName:
            user.lastName,
          email: user.email,
          role: user.role,
          totalPoints:
            user.totalPoints,
          paymentStatus:
            user.paymentStatus,
          paidAt:
            user.paidAt,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Failed to retrieve current user:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error:
          "Failed to retrieve current user.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}