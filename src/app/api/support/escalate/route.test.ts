import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supportLearning", () => ({
  createHelpdeskTicket: vi.fn().mockResolvedValue({
    id: "ticket-1",
    requesterEmail: "user@example.com",
    question: "Where am I?",
    chatbotAnswer: "Open Leaderboard",
  }),
  updateHelpdeskTicket: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/email", () => ({
  sendHelpdeskEscalationEmail: vi.fn().mockResolvedValue({ id: "mail-1" }),
}));
vi.mock("@/lib/whatsapp", () => ({
  sendAdminWhatsAppAlert: vi.fn().mockResolvedValue({
    sent: true,
    configured: true,
  }),
}));

import { POST } from "./route";
import { sendHelpdeskEscalationEmail } from "@/lib/email";
import { sendAdminWhatsAppAlert } from "@/lib/whatsapp";

function request(body: unknown) {
  return new Request("http://localhost/api/support/escalate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/support/escalate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the escalation and alerts email and WhatsApp", async () => {
    const response = await POST(request({
      requesterEmail: "user@example.com",
      question: "Where am I?",
      chatbotAnswer: "Open Leaderboard",
      interactionId: "interaction-1",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticketId).toBe("ticket-1");
    expect(body.emailStatus).toBe("SENT");
    expect(body.whatsappStatus).toBe("SENT");
    expect(sendHelpdeskEscalationEmail).toHaveBeenCalled();
    expect(sendAdminWhatsAppAlert).toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    const response = await POST(request({
      requesterEmail: "not-an-email",
      question: "Question",
      chatbotAnswer: "Answer",
    }));
    expect(response.status).toBe(400);
  });
});
