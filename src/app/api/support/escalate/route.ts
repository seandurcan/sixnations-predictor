import { NextResponse } from "next/server";

import { sendHelpdeskEscalationEmail } from "@/lib/email";
import {
  createHelpdeskTicket,
  updateHelpdeskTicket,
} from "@/lib/supportLearning";
import { sendAdminWhatsAppAlert } from "@/lib/whatsapp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requesterEmail =
      typeof body?.requesterEmail === "string" ? body.requesterEmail.trim() : "";
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const chatbotAnswer =
      typeof body?.chatbotAnswer === "string" ? body.chatbotAnswer.trim() : "";
    const interactionId =
      typeof body?.interactionId === "string" ? body.interactionId.trim() : "";

    if (!EMAIL_RE.test(requesterEmail) || !question || !chatbotAnswer) {
      return NextResponse.json(
        { error: "Enter a valid reply email address and support question." },
        { status: 400 }
      );
    }

    const ticket = await createHelpdeskTicket({
      ...(interactionId ? { interactionId } : {}),
      requesterEmail,
      question,
      chatbotAnswer,
    });

    let emailStatus: "SENT" | "FAILED" = "SENT";
    let emailError: string | undefined;

    try {
      await sendHelpdeskEscalationEmail({
        ticketId: ticket.id,
        requesterEmail,
        question: ticket.question,
        chatbotAnswer: ticket.chatbotAnswer,
      });
    } catch (error) {
      emailStatus = "FAILED";
      emailError = error instanceof Error ? error.message : "Helpdesk email failed.";
    }

    const alert = await sendAdminWhatsAppAlert(
      [
        "Perfect XV helpdesk question",
        `Ticket: ${ticket.id}`,
        `Question: ${ticket.question}`,
        "Open Support Insights to reply.",
      ].join("\n")
    );

    const whatsappStatus = alert.sent
      ? "SENT"
      : alert.configured
        ? "FAILED"
        : "NOT_CONFIGURED";

    await updateHelpdeskTicket(ticket.id, {
      emailStatus,
      whatsappStatus,
      ...(emailError ? { emailError } : {}),
      ...(alert.error ? { whatsappError: alert.error } : {}),
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      emailStatus,
      whatsappStatus,
    });
  } catch (error) {
    console.error("Helpdesk escalation failed", error);
    return NextResponse.json(
      { error: "Unable to send your question to the helpdesk." },
      { status: 500 }
    );
  }
}
