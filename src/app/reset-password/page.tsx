"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PasswordInput from "@/components/ui/PasswordInput";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
      return "Reset token is missing or invalid.";
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

      if (!response.ok || !result.success) {
        setError(result.error ?? "Password reset failed.");
        return;
      }

      setSuccess("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-3xl font-bold">Reset Password</h1>

        <p className="text-sm text-slate-600">
          Passwords must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
        </p>

        {!token && (
          <Alert variant="error" title="Missing Token">
            Invalid or missing reset token. Please check the link from your email.
          </Alert>
        )}

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

        <div>
          <PasswordInput
            aria-label="New Password"
            placeholder="New Password"
            value={password}
            disabled={loading || !token}
            showStrength
            showCriteria
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <PasswordInput
            aria-label="Confirm Password"
            placeholder="Confirm Password"
            value={confirmPassword}
            disabled={loading || !token}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {confirmPassword && !passwordsMatch && (
          <Alert variant="warning" title="Validation">
            Passwords do not match.
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={loading || !token}
        >
          {loading ? "Updating..." : "Reset Password"}
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={
        <Card className="w-full max-w-md p-6 text-center text-slate-500">
          Loading reset form...
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}