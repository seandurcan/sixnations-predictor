import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({
        success: true,
        message:
          "If an account exists for that email address, a reset link will be sent.",
      });
    }

    const token =
      crypto.randomUUID() +
      crypto.randomUUID();

    const expiresAt =
      new Date(
        Date.now() +
          1000 * 60 * 60
      );

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log(
      "Password reset token:",
      token
    );

    return NextResponse.json({
      success: true,
      token,
      message:
        "Password reset token created.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process password reset request",
      },
      {
        status: 500,
      }
    );
  }
}