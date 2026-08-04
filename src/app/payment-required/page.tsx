"use client";

import { useState } from "react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

export default function PaymentRequiredPage() {
  const [loading, setLoading] =
    useState(false);

  async function copyStripeTestDetails() {
    try {
      await navigator.clipboard.writeText(
`Card Number: 4242 4242 4242 4242
Expiry Date: 12/28
CVC: 123
Eircode: F91 W1D9`
      );

      alert(
        "Stripe test payment details copied to clipboard."
      );
    } catch (error) {
      console.error(
        "Failed to copy payment details:",
        error
      );

      alert(
        "Unable to copy payment details."
      );
    }
  }

  async function startCheckout() {
    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/stripe/create-checkout-session",
          {
            method: "POST",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Checkout session creation failed."
        );
      }

      window.location.href =
        result.checkoutUrl;
    } catch (error) {
      console.error(
        "Failed to start checkout:",
        error
      );

      alert(
        "Unable to start Stripe checkout."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6 text-[var(--brand-navy)]">
      <PageHeader
        title="Competition Entry Required"
        subtitle="Complete your entry before making predictions."
      />

      <Alert
        variant="warning"
        className="mb-6"
      >
        TEST MODE • No real payment
        will be taken.
      </Alert>

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black">
              Perfect XV Entry
            </h2>

            <p className="mt-2 text-[var(--brand-muted)]">
              To unlock predictions,
              complete the Stripe test
              payment below.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--brand-border)] bg-slate-50 p-4">
            <h3 className="mb-4 text-lg font-bold">
              Stripe Test Card Details
            </h3>

            <div className="space-y-2">
              <p>
                <strong>
                  Card Number:
                </strong>{" "}
                <span className="font-mono">
                  4242 4242 4242 4242
                </span>
              </p>

              <p>
                <strong>
                  Expiry Date:
                </strong>{" "}
                12/28
              </p>

              <p>
                <strong>
                  CVC:
                </strong>{" "}
                123
              </p>

              <p>
                <strong>
                  Eircode:
                </strong>{" "}
                F91 W1D9
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={
                copyStripeTestDetails
              }
            >
              Copy Test Card Details
            </Button>

            <Button
              onClick={startCheckout}
              disabled={loading}
            >
              {loading
                ? "Connecting To Stripe..."
                : "Pay With Stripe"}
            </Button>
          </div>

          <div className="rounded-lg bg-[var(--brand-soft-lime)] p-4">
            <p className="font-semibold">
              After a successful test
              payment your account will
              be marked as paid and
              predictions will become
              available automatically.
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}