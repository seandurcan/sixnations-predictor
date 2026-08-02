"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const [message, setMessage] =
    useState("Verifying...");

  const [variant, setVariant] =
    useState<"info" | "success" | "error">("info");

  const [loading, setLoading] =
    useState(false);

  const [canRetry, setCanRetry] =
    useState(false);

  useEffect(() => {
    verify();
  }, []);

  async function verify() {
    const token =
      searchParams.get("token");

    setLoading(true);
    setCanRetry(false);
    setVariant("info");
    setMessage("Verifying...");

    if (!token) {
      setVariant("error");
      setMessage(
        "Missing verification token."
      );
      setLoading(false);
      setCanRetry(false);
      return;
    }

    try {
      const response =
        await fetch(
          "/api/verify-email",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setVariant("success");

        setMessage(
          "Email successfully verified. You may now log in."
        );

        setCanRetry(false);
      } else {
        setVariant("error");

        setMessage(
          result.error ??
            "Email verification failed."
        );

        setCanRetry(true);
      }
    } catch {
      setVariant("error");

      setMessage(
        "Email verification failed."
      );

      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">
          Email Verification
        </h1>

        <Alert
          variant={variant}
          title={
            variant === "success"
              ? "Verification Successful"
              : variant === "error"
                ? "Verification Failed"
                : "Verifying Email"
          }
        >
          {message}
        </Alert>

        {loading && (
          <p className="mt-4 text-sm text-slate-500">
            Please wait while we verify your email.
          </p>
        )}

        {canRetry && (
          <div className="mt-4">
            <Button
              type="button"
              fullWidth
              onClick={verify}
            >
              Try Again
            </Button>
          </div>
        )}

        {variant === "success" && (
          <div className="mt-4">
            <Button
              type="button"
              fullWidth
              onClick={() => {
                window.location.href =
                  "/login";
              }}
            >
              Go To Login
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            Loading...
          </Card>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}