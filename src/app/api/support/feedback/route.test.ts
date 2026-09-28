import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supportLearning", () => ({
  recordSupportFeedback: vi.fn().mockResolvedValue(true),
}));

import { POST } from "./route";
import { recordSupportFeedback } from "@/lib/supportLearning";

function request(body: unknown) {
  return new Request("http://localhost/api/support/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/support/feedback", () => {
  it("records helpful feedback", async () => {
    const response = await POST(request({
      interactionId: "interaction-1",
      helpful: true,
    }));

    expect(response.status).toBe(200);
    expect(recordSupportFeedback).toHaveBeenCalledWith("interaction-1", true);
  });

  it("rejects malformed feedback", async () => {
    const response = await POST(request({ interactionId: "" }));
    expect(response.status).toBe(400);
  });
});
