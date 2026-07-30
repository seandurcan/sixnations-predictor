"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(
        "Email is required."
      );
      return;
    }

    if (
      !/\S+@\S+\.\S+/.test(email)
    ) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setSuccess(
          "Password reset link sent. Please check your email."
        );

        return;
      }

      setError(
        result.error ??
          "Unable to send password reset link."
      );
    } catch {
      setError(
        "Unable to connect. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <form
  onSubmit={handleSubmit}
  className="space-y-4"
  noValidate
>
          <h1 className="text-3xl font-bold">
            Forgot Password
          </h1>

          <p className="text-sm text-gray-600">
            Enter your email address and
            we'll send you a password reset
            link.
          </p>

          {success && (
            <Alert
              variant="success"
              title="Email Sent"
            >
              {success}
            </Alert>
          )}

          {error && (
            <Alert
              variant="error"
              title="Request Failed"
            >
              {error}
            </Alert>
          )}

          <Input
            type="text"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          <Button
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </Button>
        </form>
      </Card>
    </main>
  );
}