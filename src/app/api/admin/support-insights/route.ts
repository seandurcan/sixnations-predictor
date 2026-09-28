import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getSupportInsights,
  reviewSupportMapping,
} from "@/lib/supportLearning";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const insights = await getSupportInsights();
    return NextResponse.json({ success: true, ...insights });
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
    const key = typeof body?.key === "string" ? body.key : "";
    const status = body?.status;

    if (!key || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json(
        { success: false, error: "Invalid mapping review request." },
        { status: 400 }
      );
    }

    const updated = await reviewSupportMapping(key, status, adminUserId);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Support mapping was not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support mapping review failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to update support mapping." },
      { status: 500 }
    );
  }
}
