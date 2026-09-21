import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  cancelAnnouncementDelivery,
  freezeAnnouncementRecipients,
  retryFailedAnnouncementDeliveries,
  sendNextAnnouncementBatch,
} from "@/lib/email/announcementDelivery";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const adminUserId = auth.user?.id;
  if (!adminUserId) {
    return NextResponse.json(
      { success: false, error: "Authenticated administrator could not be identified." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const campaignId = Number(body.campaignId);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid announcement campaign." },
      { status: 400 }
    );
  }

  try {
    let result;
    if (body.action === "confirm") {
      if (body.confirmation !== "CONFIRM") {
        throw new Error("Explicit recipient confirmation is required.");
      }
      const expectedRecipientCount = Number(body.expectedRecipientCount);
      if (!Number.isInteger(expectedRecipientCount) || expectedRecipientCount < 0) {
        throw new Error("Review the eligible recipient count before confirming.");
      }
      result = await freezeAnnouncementRecipients(
        campaignId,
        adminUserId,
        expectedRecipientCount
      );
    } else if (body.action === "send_next") {
      if (body.confirmation !== "SEND") {
        throw new Error("Explicit batch confirmation is required.");
      }
      result = await sendNextAnnouncementBatch(campaignId);
    } else if (body.action === "retry_failed") {
      if (body.confirmation !== "RETRY") {
        throw new Error("Explicit retry confirmation is required.");
      }
      result = await retryFailedAnnouncementDeliveries(campaignId);
    } else if (body.action === "cancel") {
      if (body.confirmation !== "CANCEL") {
        throw new Error("Explicit cancellation confirmation is required.");
      }
      result = await cancelAnnouncementDelivery(campaignId);
    } else {
      return NextResponse.json(
        { success: false, error: "Select a valid delivery action." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to update announcement delivery.";
    console.error("Announcement delivery action failed", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 409 }
    );
  }
}
