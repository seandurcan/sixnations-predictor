import { NextResponse } from "next/server";
import {
  destroySession,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set(
      SESSION_COOKIE,
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
      }
    );

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
      },
      {
        status: 500,
      }
    );
  }
}