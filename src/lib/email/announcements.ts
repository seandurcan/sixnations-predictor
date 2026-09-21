import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentTournament } from "@/lib/currentTournament";
import { resend } from "@/lib/resend";

export const ANNOUNCEMENT_AUDIENCES = [
  "ALL_VERIFIED",
  "CURRENT_ENTRANTS",
  "NO_CURRENT_ENTRY",
] as const;

export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export type AnnouncementDraftInput = {
  subject: string;
  heading: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
  audience: AnnouncementAudience;
};

const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://perfect-xv.org"
).trim().replace(/\/+$/, "");

const FROM_ADDRESS = "Perfect XV <noreply@perfect-xv.org>";

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function optionalText(value: unknown, maximumLength: number) {
  const cleaned = cleanText(value, maximumLength);
  return cleaned || null;
}

function validHttpUrl(value: string | null) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function prepareAnnouncementDraft(value: Record<string, unknown>) {
  const subject = cleanText(value.subject, 160);
  const heading = cleanText(value.heading, 160);
  const message = cleanText(value.message, 5_000);
  const actionLabel = optionalText(value.actionLabel, 80);
  const actionUrl = optionalText(value.actionUrl, 500);
  const audience = ANNOUNCEMENT_AUDIENCES.includes(
    value.audience as AnnouncementAudience
  ) ? value.audience as AnnouncementAudience : null;
  const errors: string[] = [];

  if (!subject) errors.push("Enter an email subject.");
  if (!heading) errors.push("Enter an email heading.");
  if (!message) errors.push("Enter an announcement message.");
  if (!audience) errors.push("Select a valid audience.");
  if (Boolean(actionLabel) !== Boolean(actionUrl)) {
    errors.push("Provide both an action label and action link, or leave both blank.");
  }
  if (!validHttpUrl(actionUrl)) {
    errors.push("The action link must be a valid HTTP or HTTPS address.");
  }

  return {
    errors,
    draft: audience ? {
      subject,
      heading,
      message,
      actionLabel,
      actionUrl,
      audience,
    } : null,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildAnnouncementEmail(
  draft: AnnouncementDraftInput,
  options: { unsubscribeUrl: string; testMode?: boolean }
) {
  const paragraphs = draft.message
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
  const action = draft.actionLabel && draft.actionUrl
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(draft.actionUrl)}" style="display:inline-block;background:#007bff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;">${escapeHtml(draft.actionLabel)}</a></p>`
    : "";
  const testNotice = options.testMode
    ? `<div style="margin-bottom:20px;padding:12px;border:1px solid #f59e0b;background:#fffbeb;color:#78350f;border-radius:8px;"><strong>Test email:</strong> no announcement has been sent to users. The unsubscribe link confirms safely without changing your preference.</div>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;color:#0b1f34;font-family:Arial,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(draft.subject)}</div><div style="max-width:620px;margin:0 auto;padding:28px 16px;"><div style="background:#fff;border:1px solid #dbe3ec;border-radius:12px;padding:28px;">${testNotice}<p style="margin:0 0 8px;color:#007bff;font-weight:700;">PERFECT XV</p><h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;">${escapeHtml(draft.heading)}</h1>${paragraphs}${action}<p style="margin:28px 0 0;color:#64748b;font-size:13px;line-height:1.5;">You are receiving this optional Perfect XV announcement because you have an account. <a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#475569;">Unsubscribe from optional announcements</a>.</p></div></div></body></html>`;
  const text = [
    draft.heading,
    "",
    draft.message,
    draft.actionLabel && draft.actionUrl ? `\n${draft.actionLabel}: ${draft.actionUrl}` : "",
    "",
    `Unsubscribe from optional announcements: ${options.unsubscribeUrl}`,
  ].filter(Boolean).join("\n");

  return { html, text };
}

export async function getAnnouncementAudienceWhere(
  audience: AnnouncementAudience
): Promise<Prisma.UserWhereInput> {
  const baseWhere = {
    emailVerified: true,
    deletedAt: null,
    announcementOptOutAt: null,
  } satisfies Prisma.UserWhereInput;

  if (audience === "ALL_VERIFIED") {
    return baseWhere;
  }

  const currentTournament = await getCurrentTournament();
  if (!currentTournament) return { id: -1 };

  return {
    ...baseWhere,
    competitionEntries: audience === "CURRENT_ENTRANTS"
      ? { some: { tournamentId: currentTournament.id, status: "ENTERED" } }
      : { none: { tournamentId: currentTournament.id } },
  };
}

export async function getAnnouncementAudienceCount(audience: AnnouncementAudience) {
  return prisma.user.count({
    where: await getAnnouncementAudienceWhere(audience),
  });
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailPreferenceToken(
  userId: number,
  testOnly: boolean,
  validityDays = 7
) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.emailPreferenceToken.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      testOnly,
      expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function consumeEmailPreferenceToken(token: string) {
  const hash = tokenHash(token);
  return prisma.$transaction(async (tx) => {
    const preferenceToken = await tx.emailPreferenceToken.findUnique({
      where: { tokenHash: hash },
    });
    if (
      !preferenceToken ||
      preferenceToken.usedAt ||
      preferenceToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new Error("This unsubscribe link is invalid or has expired.");
    }

    await tx.emailPreferenceToken.update({
      where: { id: preferenceToken.id },
      data: { usedAt: new Date() },
    });
    if (!preferenceToken.testOnly) {
      await tx.user.update({
        where: { id: preferenceToken.userId },
        data: { announcementOptOutAt: new Date() },
      });
    }
    return { testOnly: preferenceToken.testOnly };
  });
}

export async function sendAnnouncementTest(campaignId: number, adminUserId: number) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  const [campaign, admin] = await Promise.all([
    prisma.announcementCampaign.findUnique({ where: { id: campaignId } }),
    prisma.user.findUnique({ where: { id: adminUserId } }),
  ]);
  if (!campaign || campaign.status !== "DRAFT") {
    throw new Error("Select a valid draft announcement.");
  }
  if (!admin || admin.deletedAt) {
    throw new Error("The administrator account is unavailable.");
  }

  const token = await createEmailPreferenceToken(admin.id, true);
  const unsubscribeUrl = `${APP_URL}/api/email-preferences/unsubscribe?token=${encodeURIComponent(token)}`;
  const email = buildAnnouncementEmail(campaign, {
    unsubscribeUrl,
    testMode: true,
  });
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: admin.email,
    subject: `[TEST] ${campaign.subject}`,
    html: email.html,
    text: email.text,
  });

  await prisma.announcementDelivery.create({
    data: {
      campaignId: campaign.id,
      recipientUserId: admin.id,
      recipientEmail: admin.email,
      deliveryType: "TEST",
      status: error ? "FAILED" : "SENT",
      providerMessageId: data?.id ?? null,
      errorMessage: error?.message ?? null,
    },
  });
  if (error) throw new Error(error.message || "Resend rejected the test email.");

  return { recipientEmail: admin.email, providerMessageId: data?.id ?? null };
}
