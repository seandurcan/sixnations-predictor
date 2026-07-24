import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      body.password,
      12
    );

    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        mobile: body.mobile,
        passwordHash,
        registrationOrder: userCount + 1,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}