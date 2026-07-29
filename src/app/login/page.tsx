"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidEmail(value: string) {
    return /\S+@\S+\.\S+/.test(value);
  }

  function validateForm() {
    if (!email.trim()) {
      return "Email is required.";
    }

    if (!isValidEmail(email)) {
      return "Enter a valid email address.";
    }

    if (!password.trim()) {
      return "Password is required.";
    }

    return "";
  }

  async function handleLogin(e: React.FormEvent) {
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
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error ?? "Login failed.");
        return;
      }

      setSuccess("Login successful. Redirecting...");

      localStorage.setItem("userId", result.userId);

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <form onSubmit={handleLogin} className="space-y-4">
          <h1 className="text-3xl font-bold">
            Login
          </h1>

          {success && (
            <Alert variant="success" title="Success">
              {success}
            </Alert>
          )}

          {error && (
            <Alert variant="error" title="Login Failed">
              {error}
            </Alert>
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading}
            onClick={() => {
              window.location.href = "/forgot-password";
            }}
          >
            Forgot Password?
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading}
            onClick={() => {
              window.location.href = "/register";
            }}
          >
            Create Account
          </Button>
        </form>
      </Card>
    </main>
  );
}