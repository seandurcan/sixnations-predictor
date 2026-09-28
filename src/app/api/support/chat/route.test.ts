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
  it("answers from the approved support knowledge", async () => {
    const response = await POST(request({ message: "When do predictions lock?" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.answer).toContain("one minute before");
    expect(body.sources.length).toBeGreaterThan(0);
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
