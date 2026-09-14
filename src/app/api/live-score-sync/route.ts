import { NextResponse } from "next/server";
import { syncLiveScores } from "@/lib/liveScoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await syncLiveScores();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Live score sync failed", error);
    return NextResponse.json(
      {
        checked: false,
        error: error instanceof Error ? error.message : "Live score sync failed",
      },
      { status: 500 }
    );
  }
}
