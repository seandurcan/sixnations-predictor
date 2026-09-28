import { NextResponse } from "next/server";

import {
  answerSupportQuestion,
  answerSupportTopic,
} from "@/lib/supportKnowledge";
import type { SupportApprovedMapping } from "@/lib/supportKnowledge";
import {
  getApprovedSupportMappings,
  logSupportInteraction,
  recordSupportSelection,
} from "@/lib/supportLearning";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topicId = typeof body?.topicId === "string" ? body.topicId.trim() : "";
    const interactionId =
      typeof body?.interactionId === "string" ? body.interactionId.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (topicId) {
      const answer = answerSupportTopic(topicId);

      if (interactionId) {
        try {
          await recordSupportSelection(interactionId, topicId);
        } catch (error) {
          console.error("Support option learning failed", error);
        }
      }

      return NextResponse.json(
        { ...answer, interactionId: interactionId || null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

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

    let approvedMappings: SupportApprovedMapping[] = [];
    try {
      approvedMappings = await getApprovedSupportMappings();
    } catch (error) {
      console.error("Approved support mapping load failed", error);
    }

    const answer = answerSupportQuestion(message, approvedMappings);
    let newInteractionId: string | null = null;

    try {
      newInteractionId = await logSupportInteraction(message, answer);
    } catch (error) {
      console.error("Support interaction logging failed", error);
    }

    return NextResponse.json(
      { ...answer, interactionId: newInteractionId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to process that support question." },
      { status: 400 }
    );
  }
}
