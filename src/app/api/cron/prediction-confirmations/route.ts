import { NextResponse } from "next/server";
import { processDuePredictionConfirmations } from "@/lib/email/predictionConfirmations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ success: true, ...(await processDuePredictionConfirmations()) });
  } catch (error) {
    console.error("Prediction confirmation cron failed", error);
    return NextResponse.json({ success: false, error: "Prediction confirmation processing failed." }, { status: 500 });
  }
}
