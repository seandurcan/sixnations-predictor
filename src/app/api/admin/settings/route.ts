import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  try {
    await requireAdmin();

    const setting =
      await prisma.systemSetting.findUnique({
        where: {
          key: "automaticRemindersEnabled",
        },
      });

    return NextResponse.json({
      success: true,
      automaticRemindersEnabled:
        setting?.value !== "false",
    });
  } catch (error) {
    console.error(
      "Failed to load settings:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body =
      await request.json();

    const enabled =
      Boolean(
        body.automaticRemindersEnabled
      );

    await prisma.systemSetting.upsert({
      where: {
        key: "automaticRemindersEnabled",
      },
      update: {
        value: String(enabled),
      },
      create: {
        key: "automaticRemindersEnabled",
        value: String(enabled),
      },
    });

    return NextResponse.json({
      success: true,
      automaticRemindersEnabled:
        enabled,
    });
  } catch (error) {
    console.error(
      "Failed to update settings:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update settings.",
      },
      {
        status: 500,
      }
    );
  }
}