"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";

const REGISTRATION_EMAIL_KEY =
  "perfect-xv-registration-email";

export default function RegistrationSuccessPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(
      sessionStorage.getItem(REGISTRATION_EMAIL_KEY) ?? ""
    );
  }, []);

  async function resendVerification() {
    if (!email) {
      return;
    }

    setSending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ??
            "Unable to resend the verification email."
        );
        return;
      }

      setMessage(
        "Verification email sent. Please check your inbox and junk or spam folder."
      );
    } catch {
      setError(
        "Unable to resend the verification email. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            Registration Successful
          </h1>

          <Alert
            variant="success"
            title="Account Created"
          >
            Your Perfect XV account has been created.
          </Alert>

          <p className="text-slate-700">
            A verification email is being sent
            {email ? (
              <>
                {" "}to <strong>{email}</strong>
              </>
            ) : null}
            . Open the email and select <strong>Verify Email</strong>
            before logging in.
          </p>

          <p className="text-sm text-slate-600">
            If it does not arrive, check your junk or spam folder.
            You can also resend it below.
          </p>

          {message && (
            <Alert
              variant="success"
              title="Email Sent"
            >
              {message}
            </Alert>
          )}

          {error && (
            <Alert
              variant="error"
              title="Email Not Sent"
            >
              {error}
            </Alert>
          )}

          {email && (
            <Button
              type="button"
              fullWidth
              disabled={sending}
              onClick={resendVerification}
            >
              {sending
                ? "Sending..."
                : "Resend Verification Email"}
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
