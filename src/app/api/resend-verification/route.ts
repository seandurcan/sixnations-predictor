import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";

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
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
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

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await sendEmailVerificationEmail(
      user.email,
      token
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to resend verification email",
      },
      {
        status: 500,
      }
    );
  }
}