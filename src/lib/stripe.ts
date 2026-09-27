import Stripe from "stripe";

let client: Stripe | undefined;

function getClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
  }
  client ??= new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });
  return client;
}

// Importing routes during a build must not initialize the payment service.
export const stripe = {
  get checkout() {
    return getClient().checkout;
  },
  get webhooks() {
    return getClient().webhooks;
  },
};
