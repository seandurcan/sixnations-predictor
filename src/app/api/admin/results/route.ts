import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyMatchScore, setManualOverride } from "@/lib/liveScoring";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    if (body.testMode === true) {
      await prisma.systemSetting.upsert({
        where: { key: "ADMIN_TEST_SCORING_ACTIVE" },
        update: { value: "true" },
        create: { key: "ADMIN_TEST_SCORING_ACTIVE", value: "true" },
      });
    }

    const matchId = Number(body.matchId);
    const homeScore = Number(body.homeScore);
    const awayScore = Number(body.awayScore);

    if (
      !Number.isInteger(matchId) ||
      !Number.isFinite(homeScore) ||
      !Number.isFinite(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid result" },
        { status: 400 }
      );
    }

    const completed = body.completed === false ? false : true;

    const result = await applyMatchScore({
      matchId,
      homeScore,
      awayScore,
      completed,
      source: "ADMIN",
      adminUserId: adminUser.id,
      manualOverride: body.testMode !== true,
      providerStatus: completed ? "Manual Full Time" : "Manual Live Score",
    });

    if (body.testMode !== true) {
      await setManualOverride(matchId, true);
    }

    return NextResponse.json({
      success: true,
      snapshotNumber: result.snapshotNumber,
      match: result.match,
      manualOverride: body.testMode !== true,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to save result";

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
    if (message === "Match not found") {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to save result" },
      { status: 500 }
    );
  }
}
