import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const user =
      await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    const validPassword =
      await bcrypt.compare(
        body.password,
        user.passwordHash
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please verify your email address before logging in.",
          emailVerificationRequired: true,
        },
        {
          status: 403,
        }
      );
    }

    const session =
      await createSession(
        user.id
      );

    const response =
      NextResponse.json({
        success: true,
        firstName:
          user.firstName,
        email:
          user.email,
        role:
          user.role,
      });

    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        expires:
          session.expiresAt,
      }
    );

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}