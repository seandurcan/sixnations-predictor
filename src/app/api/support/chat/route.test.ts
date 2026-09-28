import { describe, expect, it } from "vitest";

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/support/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/support/chat", () => {
  it("recognises league position and links to the leaderboard", async () => {
    const response = await POST(request({ message: "how do I find my position in the league" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matchedTopic).toBe("Finding your leaderboard position");
    expect(body.action).toEqual({
      label: "Open Leaderboard",
      href: "/leaderboard",
    });
  });

  it("answers a clear question from approved support knowledge", async () => {
    const response = await POST(request({ message: "When do predictions lock?" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.answer).toContain("one minute before");
    expect(body.sources.length).toBeGreaterThan(0);
    expect(body.action.href).toBe("/predictions");
  });

  it("returns interpretation options for an ambiguous question", async () => {
    const response = await POST(request({ message: "Can you explain my points?" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.needsChoice).toBe(true);
    expect(body.options.length).toBeGreaterThan(1);
    expect(body.action).toBeNull();
  });

  it("returns the selected option answer with a quick destination", async () => {
    const response = await POST(request({ topicId: "scoring" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.answer).toContain("correct match result earns 1 point");
    expect(body.needsChoice).toBe(false);
  });

  it("rejects an empty question", async () => {
    const response = await POST(request({ message: "   " }));
    expect(response.status).toBe(400);
  });

  it("rejects an excessively long question", async () => {
    const response = await POST(request({ message: "x".repeat(601) }));
    expect(response.status).toBe(400);
  });
});
