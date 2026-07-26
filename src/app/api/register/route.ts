import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";

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

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email already exists",
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

    const userCount =
      await prisma.user.count();

    const user =
      await prisma.user.create({
        data: {
          firstName:
            body.firstName,
          lastName:
            body.lastName,
          email:
            body.email,
          mobile:
            body.mobile,
          passwordHash,
          registrationOrder:
            userCount + 1,
        },
      });

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

    try {
      await sendEmailVerificationEmail(
        user.email,
        token
      );
    } catch (emailError) {
      console.error(
        "Verification email failed:",
        emailError
      );
    }

    return NextResponse.json({
      success: true,
      emailVerificationRequired: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Registration failed",
      },
      {
        status: 500,
      }
    );
  }
}