import { NextRequest, NextResponse } from "next/server";

import { getHelpdeskTicket } from "@/lib/supportLearning";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== "staging") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ticketId = request.nextUrl.searchParams.get("ticket")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(ticketId)) {
    return NextResponse.json({ error: "Invalid ticket." }, { status: 400 });
  }

  const ticket = await getHelpdeskTicket(ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  return NextResponse.json({
    ticketId: ticket.id,
    emailStatus: ticket.emailStatus,
    emailError: ticket.emailError ?? null,
    whatsappStatus: ticket.whatsappStatus,
    whatsappError: ticket.whatsappError ?? null,
  });
}
