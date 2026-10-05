import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import {
  TESTER_CHECK_ACTIVITY_IDS,
  TESTER_CHECK_SECTIONS,
  type TesterCheckStatus,
} from "@/lib/testerCheckSheet";

const FROM = "Perfect XV Testing <noreply@perfect-xv.org>";
const ADMIN_EMAIL = "administrator@perfect-xv.org";
const VALID_STATUSES = new Set<TesterCheckStatus>(["ok", "issue", "not-tested"]);
const RATE_LIMIT_MS = 2 * 60 * 1000;

function textValue(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusLabel(status: TesterCheckStatus) {
  if (status === "ok") return "OK";
  if (status === "issue") return "ISSUE";
  return "Not tested";
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    if (textValue(body.website, 200)) {
      return NextResponse.json({ success: true });
    }

    const testerName =
      textValue(body.testerName, 120) ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      "Perfect XV tester";
    const testerEmail = textValue(body.testerEmail, 254) || user.email;
    const device = textValue(body.device, 200);
    const overallComments = textValue(body.overallComments, 4000);

    const rawStatuses =
      body.statuses && typeof body.statuses === "object" ? body.statuses : {};
    const rawComments =
      body.comments && typeof body.comments === "object" ? body.comments : {};

    const statuses: Record<string, TesterCheckStatus> = {};
    for (const activityId of TESTER_CHECK_ACTIVITY_IDS) {
      const value = rawStatuses[activityId];
      statuses[activityId] = VALID_STATUSES.has(value)
        ? value
        : "not-tested";
    }

    const comments: Record<string, string> = {};
    for (const section of TESTER_CHECK_SECTIONS) {
      comments[section.id] = textValue(rawComments[section.id], 2000);
      const sectionHasIssue = section.activities.some(
        (activity) => statuses[activity.id] === "issue"
      );
      if (sectionHasIssue && !comments[section.id]) {
        return NextResponse.json(
          {
            success: false,
            error: `Please add a short comment for ${section.title} because an issue is marked there.`,
          },
          { status: 400 }
        );
      }
    }

    const throttleKey = `TESTER_CHECK_SHEET_LAST_SUBMIT_${user.id}`;
    const previous = await prisma.systemSetting.findUnique({
      where: { key: throttleKey },
      select: { value: true },
    });
    const previousAt = previous ? Date.parse(previous.value) : NaN;
    if (Number.isFinite(previousAt) && Date.now() - previousAt < RATE_LIMIT_MS) {
      return NextResponse.json(
        {
          success: false,
          error: "Your check sheet was just submitted. Please wait a moment before sending another copy.",
        },
        { status: 429 }
      );
    }

    const issueCount = Object.values(statuses).filter(
      (status) => status === "issue"
    ).length;

    const sectionHtml = TESTER_CHECK_SECTIONS.map((section) => {
      const rows = section.activities
        .map(
          (activity) =>
            `<tr><td style="padding:7px;border-bottom:1px solid #ddd">${escapeHtml(activity.label)}</td><td style="padding:7px;border-bottom:1px solid #ddd;font-weight:bold">${statusLabel(statuses[activity.id])}</td></tr>`
        )
        .join("");
      const comment = comments[section.id]
        ? `<p style="margin:10px 0 0"><strong>Comments:</strong> ${escapeHtml(comments[section.id]).replace(/\n/g, "<br>")}</p>`
        : "";
      return `<h2 style="color:#012169;font-size:18px;margin:24px 0 8px">${escapeHtml(section.title)}</h2><table width="100%" style="border-collapse:collapse">${rows}</table>${comment}`;
    }).join("");

    const sectionText = TESTER_CHECK_SECTIONS.flatMap((section) => [
      section.title,
      ...section.activities.map(
        (activity) =>
          `- ${activity.label}: ${statusLabel(statuses[activity.id])}`
      ),
      comments[section.id] ? `Comments: ${comments[section.id]}` : "",
      "",
    ]).join("\n");

    const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#222"><h1 style="color:#012169">Perfect XV Tester Check Sheet</h1><p><strong>Tester:</strong> ${escapeHtml(testerName)}</p><p><strong>Email:</strong> ${escapeHtml(testerEmail)}</p><p><strong>Device/browser:</strong> ${escapeHtml(device || "Not supplied")}</p><p><strong>Issues marked:</strong> ${issueCount}</p>${sectionHtml}<h2 style="color:#012169;font-size:18px">Overall comments</h2><p>${escapeHtml(overallComments || "None supplied").replace(/\n/g, "<br>")}</p></body></html>`;

    const text = [
      "Perfect XV Tester Check Sheet",
      `Tester: ${testerName}`,
      `Email: ${testerEmail}`,
      `Device/browser: ${device || "Not supplied"}`,
      `Issues marked: ${issueCount}`,
      "",
      sectionText,
      "Overall comments:",
      overallComments || "None supplied",
    ].join("\n");

    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: testerEmail,
      subject: `Perfect XV tester check – ${testerName} – ${issueCount} issue${issueCount === 1 ? "" : "s"}`,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message || "The tester check sheet email was rejected.");
    }

    await prisma.systemSetting.upsert({
      where: { key: throttleKey },
      update: { value: new Date().toISOString() },
      create: { key: throttleKey, value: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, issueCount });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The tester check sheet could not be submitted.";

    if (message === "Authentication required") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("Tester check sheet submission failed", error);
    return NextResponse.json(
      {
        success: false,
        error: "The tester check sheet could not be emailed. Please print it or try again.",
      },
      { status: 500 }
    );
  }
}
