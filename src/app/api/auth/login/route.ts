import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request
        .json()
        .catch(() => null)) as LoginBody | null;

    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    const email = body.email
      .trim()
      .toLowerCase();

    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email or password.",
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
      await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
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
        expires: session.expiresAt,
      }
    );

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Login failed. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}