import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        emailVerified: false,
      },
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        createdAt: true,
        lastVerificationReminderAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load unverified users";

    if (message === "Authentication required") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (message === "Admin access required") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to load unverified users" },
      { status: 500 }
    );
  }
}
