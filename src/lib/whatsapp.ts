type WhatsAppAlertResult = {
  sent: boolean;
  configured: boolean;
  error?: string;
};

export async function sendAdminWhatsAppAlert(message: string): Promise<WhatsAppAlertResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const to = process.env.WHATSAPP_ADMIN_TO?.trim();
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim();
  const templateName = process.env.WHATSAPP_ALERT_TEMPLATE_NAME?.trim();
  const templateLanguage =
    process.env.WHATSAPP_ALERT_TEMPLATE_LANGUAGE?.trim() || "en";

  if (!token || !phoneNumberId || !to || !graphVersion) {
    return { sent: false, configured: false };
  }

  const ticketMatch = message.match(/Ticket:\s*([^\n]+)/i);
  const ticketReference = ticketMatch?.[1]?.trim() || "new ticket";

  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: ticketReference }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message.slice(0, 3500),
        },
      };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      return {
        sent: false,
        configured: true,
        error: `WhatsApp API ${response.status}: ${detail}`,
      };
    }

    return { sent: true, configured: true };
  } catch (error) {
    return {
      sent: false,
      configured: true,
      error: error instanceof Error ? error.message : "WhatsApp alert failed.",
    };
  }
}
