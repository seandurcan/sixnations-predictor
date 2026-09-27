import { afterEach, describe, expect, it, vi } from "vitest";

describe("payment client configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("can be imported without credentials but refuses to use an unconfigured service", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { stripe } = await import("./stripe");
    expect(() => stripe.checkout).toThrow("STRIPE_SECRET_KEY is missing");
    expect(() => stripe.webhooks).toThrow("STRIPE_SECRET_KEY is missing");
  });

  it("exposes the configured SDK without creating a payment", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_not_a_real_key");
    const { stripe } = await import("./stripe");
    expect(typeof stripe.checkout.sessions.create).toBe("function");
    expect(typeof stripe.webhooks.constructEvent).toBe("function");
    expect(stripe.checkout).toBe(stripe.checkout);
  });
});
