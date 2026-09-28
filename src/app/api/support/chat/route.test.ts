import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supportLearning", () => ({
  getApprovedSupportMappings: vi.fn().mockResolvedValue([]),
  logSupportInteraction: vi.fn().mockResolvedValue("interaction-1"),
  recordSupportSelection: vi.fn().mockResolvedValue(true),
}));

import { POST } from "./route";
import {
  logSupportInteraction,
  recordSupportSelection,
} from "@/lib/supportLearning";

function request(body: unknown) {
  return new Request("http://localhost/api/support/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/support/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(logSupportInteraction).mockResolvedValue("interaction-1");
    vi.mocked(recordSupportSelection).mockResolvedValue(true);
  });

  it("logs a support question and returns an interaction id", async () => {
    const response = await POST(request({ message: "how do I find my position in the league" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matchedTopic).toBe("Finding your leaderboard position");
    expect(body.action.href).toBe("/leaderboard");
    expect(body.interactionId).toBe("interaction-1");
    expect(logSupportInteraction).toHaveBeenCalled();
  });

  it("records which likely option the user selected", async () => {
    const response = await POST(request({
      topicId: "scoring",
      interactionId: "interaction-1",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.answer).toContain("correct match result earns 1 point");
    expect(recordSupportSelection).toHaveBeenCalledWith("interaction-1", "scoring");
  });

  it("rejects an empty question", async () => {
    const response = await POST(request({ message: "   " }));
    expect(response.status).toBe(400);
  });
});
