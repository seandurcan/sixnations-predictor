import { afterEach, describe, expect, it, vi } from "vitest";

describe("email client configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows build-time imports without mail credentials, but fails clearly on use", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { resend } = await import("./resend");
    await expect(import("./email")).resolves.toBeDefined();
    expect(() => resend.emails).toThrow("RESEND_API_KEY is not configured.");
    expect(() => resend.batch).toThrow("RESEND_API_KEY is not configured.");
  });

  it("initializes the SDK once configuration becomes available without sending mail", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { resend } = await import("./resend");
    vi.stubEnv("RESEND_API_KEY", "re_test_not_a_real_key");
    expect(typeof resend.emails.send).toBe("function");
    expect(typeof resend.batch.send).toBe("function");
    expect(resend.emails).toBe(resend.emails);
  });
});
