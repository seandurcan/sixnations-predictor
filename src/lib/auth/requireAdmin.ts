import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value;

    if (!sessionToken) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized: No session token provided" },
          { status: 401 }
        ),
      };
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized: Invalid or expired session" },
          { status: 401 }
        ),
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user: session.user,
    };
  } catch (error) {
    console.error("Admin authorization error:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal Server Error during authorization" },
        { status: 500 }
      ),
    };
  }
}