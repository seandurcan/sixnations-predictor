import { NextRequest } from "next/server";
import { consumeEmailPreferenceToken } from "@/lib/email/announcements";

function page(content: string, status = 200) {
  return new Response(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Perfect XV Email Preferences</title></head><body style="margin:0;background:#f4f7fb;color:#0b1f34;font-family:Arial,sans-serif;"><main style="max-width:600px;margin:48px auto;padding:0 18px;"><section style="background:#fff;border:1px solid #dbe3ec;border-radius:12px;padding:28px;"><p style="color:#007bff;font-weight:700;">PERFECT XV</p>${content}</section></main></body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) return page("<h1>Invalid link</h1><p>This unsubscribe link is incomplete.</p>", 400);
  return page(`<h1>Optional announcement emails</h1><p>Select confirm to unsubscribe. Account-security and essential service emails are not affected.</p><form method="post"><input type="hidden" name="token" value="${token.replaceAll('"', "&quot;")}"><button type="submit" style="border:0;border-radius:8px;background:#0b1f34;color:#fff;padding:12px 18px;font-weight:700;cursor:pointer;">Confirm unsubscribe</button></form>`);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = typeof form.get("token") === "string" ? String(form.get("token")) : "";
  try {
    const result = await consumeEmailPreferenceToken(token);
    return result.testOnly
      ? page("<h1>Test successful</h1><p>The unsubscribe link works. Your email preference was not changed because this was a test email.</p>")
      : page("<h1>You are unsubscribed</h1><p>You will no longer receive optional Perfect XV announcements. Account-security and essential service emails are not affected.</p>");
  } catch (error) {
    const message = error instanceof Error ? error.message : "The link could not be processed.";
    return page(`<h1>Unable to unsubscribe</h1><p>${message}</p>`, 400);
  }
}
