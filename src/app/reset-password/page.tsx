"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PasswordInput from "@/components/ui/PasswordInput";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const passwordsMatch = password === confirmPassword;

  function passwordMeetsCriteria(passwordValue: string) {
    return (
      passwordValue.length >= 8 &&
      /[A-Z]/.test(passwordValue) &&
      /[a-z]/.test(passwordValue) &&
      /\d/.test(passwordValue) &&
      /[^A-Za-z0-9]/.test(passwordValue)
    );
  }

  function validateForm() {
    if (!token) {
      return "Reset token is missing.";
    }

    if (!password) {
      return "Password is required.";
    }

    if (!passwordMeetsCriteria(password)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (!passwordsMatch) {
      return "Passwords do not match.";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error ?? "Password reset failed.");
        return;
      }

      setSuccess("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-3xl font-bold">
            Reset Password
          </h1>

          <p className="text-sm text-slate-600">
            Passwords must be at least 8 characters and include
            uppercase, lowercase, a number, and a special character.
          </p>

          {success && (
            <Alert variant="success" title="Success">
              {success}
            </Alert>
          )}

          {error && (
            <Alert variant="error" title="Reset Failed">
              {error}
            </Alert>
          )}

          <PasswordInput
            placeholder="New Password"
            value={password}
            disabled={loading}
            showStrength
            showCriteria
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            placeholder="Confirm Password"
            value={confirmPassword}
            disabled={loading}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {confirmPassword && !passwordsMatch && (
            <Alert variant="warning" title="Validation">
              Passwords do not match.
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>
      </Card>
    </main>
  );
}