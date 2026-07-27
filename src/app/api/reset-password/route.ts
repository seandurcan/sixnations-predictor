import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    if (
      body.password !==
      body.confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Passwords do not match",
        },
        {
          status: 400,
        }
      );
    }

    const reset =
      await prisma.passwordReset.findUnique({
        where: {
          token: body.token,
        },
      });

    if (!reset) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid reset token",
        },
        {
          status: 400,
        }
      );
    }

    if (reset.used) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reset token has already been used",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reset.expiresAt <
      new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reset token has expired",
        },
        {
          status: 400,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        body.password,
        12
      );

    await prisma.user.update({
      where: {
        id: reset.userId,
      },
      data: {
        passwordHash,
      },
    });

    await prisma.passwordReset.update({
      where: {
        id: reset.id,
      },
      data: {
        used: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password successfully reset",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to reset password",
      },
      {
        status: 500,
      }
    );
  }
}