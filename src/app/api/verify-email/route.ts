import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const verification =
      await prisma.emailVerification.findUnique({
        where: {
          token: body.token,
        },
      });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid verification token",
        },
        {
          status: 400,
        }
      );
    }

    if (
      verification.verifiedAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email already verified",
        },
        {
          status: 400,
        }
      );
    }

    if (
      verification.expiresAt <
      new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Verification token expired",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.user.update({
      where: {
        id: verification.userId,
      },
      data: {
        emailVerified: true,
      },
    });

    await prisma.emailVerification.update({
      where: {
        id: verification.id,
      },
      data: {
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Email verification failed",
      },
      {
        status: 500,
      }
    );
  }
}