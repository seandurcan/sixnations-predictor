import { NextResponse } from "next/server";

import { answerSupportQuestion } from "@/lib/supportKnowledge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Enter a question for Perfect XV Support." },
        { status: 400 }
      );
    }

    if (message.length > 600) {
      return NextResponse.json(
        { error: "Please keep support questions under 600 characters." },
        { status: 400 }
      );
    }

    return NextResponse.json(answerSupportQuestion(message), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process that support question." },
      { status: 400 }
    );
  }
}
