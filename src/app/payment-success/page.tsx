"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";

type PaymentState =
  | "checking"
  | "confirmed"
  | "pending"
  | "error";

export default function PaymentSuccessPage() {
  const [state, setState] =
    useState<PaymentState>("checking");

  const [message, setMessage] =
    useState(
      "Confirming your Perfect XV competition entry payment..."
    );

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      try {
        for (
          let attempt = 1;
          attempt <= 15;
          attempt += 1
        ) {
          const response = await fetch(
            "/api/auth/me",
            {
              cache: "no-store",
            }
          );

          if (response.status === 401) {
            window.location.href =
              "/login";
            return;
          }

          if (!response.ok) {
            throw new Error(
              "Unable to confirm payment."
            );
          }

          const result =
            await response.json();

          if (
            result.user?.paymentStatus ===
            "COMPLETED"
          ) {
            if (cancelled) {
              return;
            }

            setState("confirmed");
            setMessage(
              "Payment confirmed. Your predictions are now unlocked."
            );

            window.setTimeout(() => {
              if (!cancelled) {
                window.location.href =
                  "/predictions";
              }
            }, 1000);

            return;
          }

          if (attempt < 15) {
            await new Promise(
              (resolve) =>
                window.setTimeout(
                  resolve,
                  800
                )
            );
          }
        }

        if (!cancelled) {
          setState("pending");
          setMessage(
            "Your payment has been returned by Stripe, but account confirmation is still processing. Please check again in a moment."
          );
        }
      } catch (error) {
        console.error(
          "Payment confirmation failed:",
          error
        );

        if (!cancelled) {
          setState("error");
          setMessage(
            "Perfect XV could not confirm the payment yet. Please try the check again."
          );
        }
      }
    }

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Competition Entry Payment"
          subtitle="Perfect XV"
        />

        <Card className="mt-6">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold">
              {state === "confirmed"
                ? "Payment Confirmed"
                : state === "checking"
                  ? "Confirming Payment"
                  : "Payment Confirmation Pending"}
            </h2>

            <p className="text-[var(--brand-muted)]">
              {message}
            </p>

            {state === "checking" && (
              <p className="text-sm text-[var(--brand-muted)]">
                Please keep this page open for a few seconds while Stripe confirmation is received.
              </p>
            )}

            {state === "confirmed" && (
              <p className="font-semibold text-green-700">
                Redirecting to Predictions...
              </p>
            )}

            {(state === "pending" ||
              state === "error") && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Check Payment Again
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    window.location.href =
                      "/dashboard";
                  }}
                >
                  Return To Dashboard
                </Button>
              </div>
            )}
          </div>
        </Card>
      </PageContainer>
    </main>
  );
}
