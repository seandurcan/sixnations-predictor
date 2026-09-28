import { NextResponse } from "next/server";

import { recordSupportFeedback } from "@/lib/supportLearning";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const interactionId =
      typeof body?.interactionId === "string" ? body.interactionId.trim() : "";
    const helpful = body?.helpful;

    if (!interactionId || typeof helpful !== "boolean") {
      return NextResponse.json(
        { error: "Invalid support feedback." },
        { status: 400 }
      );
    }

    const recorded = await recordSupportFeedback(interactionId, helpful);

    return NextResponse.json(
      { success: recorded },
      { status: recorded ? 200 : 404 }
    );
  } catch (error) {
    console.error("Support feedback failed", error);
    return NextResponse.json(
      { error: "Unable to save support feedback." },
      { status: 500 }
    );
  }
}
