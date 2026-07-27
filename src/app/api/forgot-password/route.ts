import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

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
          "If an account exists for that email address, a reset link has been sent.",
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
      "GENERATED RESET TOKEN:",
      token
    );

    await sendPasswordResetEmail(
      user.email,
      token
    );

    console.log(
      "PASSWORD RESET EMAIL SENT TO:",
      user.email
    );

    return NextResponse.json({
      success: true,
      token,
      message:
        "Password reset email sent.",
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

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