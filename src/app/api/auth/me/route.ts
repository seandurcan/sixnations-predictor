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
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
        email:
          user.email,
        role:
          user.role,
        totalPoints:
          user.totalPoints,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        authenticated: false,
        error:
          "Failed to retrieve current user",
      },
      {
        status: 500,
      }
    );
  }
}