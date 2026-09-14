import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setManualOverride } from "@/lib/liveScoring";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const matchId = Number(body.matchId);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        { success: false, error: "Invalid match" },
        { status: 400 }
      );
    }

    await setManualOverride(matchId, false);

    return NextResponse.json({
      success: true,
      matchId,
      manualOverride: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { success: false, error: message },
      {
        status:
          message === "Authentication required"
            ? 401
            : message === "Admin access required"
              ? 403
              : 500,
      }
    );
  }
}
