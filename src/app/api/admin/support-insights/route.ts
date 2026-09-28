import { NextRequest, NextResponse } from "next/server";

import { sendHelpdeskReplyEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getSupportTopicOptions } from "@/lib/supportKnowledge";
import {
  getHelpdeskTicket,
  getSupportInsights,
  publishHelpdeskClarification,
  reviewSupportMapping,
  updateHelpdeskTicket,
} from "@/lib/supportLearning";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const insights = await getSupportInsights();
    return NextResponse.json({
      success: true,
      ...insights,
      topicOptions: getSupportTopicOptions(),
    });
  } catch (error) {
    console.error("Support insights load failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to load support insights." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const adminUserId = auth.user?.id;
  if (!adminUserId) {
    return NextResponse.json(
      { success: false, error: "Administrator identity unavailable." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "review-mapping";

    if (action === "review-mapping") {
      const key = typeof body?.key === "string" ? body.key : "";
      const status = body?.status;

      if (!key || (status !== "APPROVED" && status !== "REJECTED")) {
        return NextResponse.json(
          { success: false, error: "Invalid mapping review request." },
          { status: 400 }
        );
      }

      const updated = await reviewSupportMapping(key, status, adminUserId);
      return updated
        ? NextResponse.json({ success: true })
        : NextResponse.json(
            { success: false, error: "Support mapping was not found." },
            { status: 404 }
          );
    }

    if (action === "reply-ticket") {
      const ticketId = typeof body?.ticketId === "string" ? body.ticketId.trim() : "";
      const reply = typeof body?.reply === "string" ? body.reply.trim() : "";
      const topicId = typeof body?.topicId === "string" ? body.topicId.trim() : "";
      const publishToChatbot = body?.publishToChatbot === true;

      if (!ticketId || !reply) {
        return NextResponse.json(
          { success: false, error: "Ticket and reply are required." },
          { status: 400 }
        );
      }

      const ticket = await getHelpdeskTicket(ticketId);
      if (!ticket) {
        return NextResponse.json(
          { success: false, error: "Helpdesk ticket was not found." },
          { status: 404 }
        );
      }

      if (publishToChatbot && !topicId) {
        return NextResponse.json(
          { success: false, error: "Choose a chatbot topic before publishing the clarification." },
          { status: 400 }
        );
      }

      await sendHelpdeskReplyEmail({
        requesterEmail: ticket.requesterEmail,
        ticketId: ticket.id,
        question: ticket.question,
        reply,
      });

      let learningPublished = false;
      if (publishToChatbot) {
        const clarification = await publishHelpdeskClarification({
          ticket,
          answer: reply,
          topicId,
          approvedById: adminUserId,
        });
        learningPublished = Boolean(clarification);
      }

      await updateHelpdeskTicket(ticket.id, {
        status: "ANSWERED",
        adminReply: reply.slice(0, 1800),
        repliedAt: new Date().toISOString(),
        repliedById: adminUserId,
        replyEmailStatus: "SENT",
        learningPublished,
        ...(learningPublished ? { learningTopicId: topicId } : {}),
      });

      return NextResponse.json({ success: true, learningPublished });
    }

    if (action === "close-ticket") {
      const ticketId = typeof body?.ticketId === "string" ? body.ticketId.trim() : "";
      if (!ticketId) {
        return NextResponse.json(
          { success: false, error: "Ticket is required." },
          { status: 400 }
        );
      }
      const updated = await updateHelpdeskTicket(ticketId, { status: "CLOSED" });
      return updated
        ? NextResponse.json({ success: true })
        : NextResponse.json(
            { success: false, error: "Helpdesk ticket was not found." },
            { status: 404 }
          );
    }

    return NextResponse.json(
      { success: false, error: "Unknown support action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Support admin action failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to update support helpdesk." },
      { status: 500 }
    );
  }
}
