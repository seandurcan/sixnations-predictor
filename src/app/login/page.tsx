"use client";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";

type LoginResponse = {
  success?: boolean;
  error?: string;
};

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  function validateForm() {
    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!form.password) {
      return "Password is required.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: form.email
              .trim()
              .toLowerCase(),
            password: form.password,
          }),
        }
      );

      const result =
        (await response
          .json()
          .catch(() => null)) as
          | LoginResponse
          | null;

      if (!response.ok) {
        setError(
          result?.error ??
            "Login failed. Please try again."
        );
        return;
      }

      window.location.assign(
        "/dashboard"
      );
    } catch (loginError) {
      console.error(
        "Login request failed:",
        loginError
      );

      setError(
        "Unable to connect. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <h1 className="text-3xl font-bold text-[var(--brand-navy)]">
            Login
          </h1>

          {error && (
            <Alert
              variant="error"
              title="Login Failed"
            >
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[var(--brand-navy)]"
            >
              Email
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              disabled={loading}
              aria-invalid={
                error
                  .toLowerCase()
                  .includes("email")
              }
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email:
                    event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[var(--brand-navy)]"
            >
              Password
            </label>

            <PasswordInput
              id="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              disabled={loading}
              aria-invalid={
                error
                  .toLowerCase()
                  .includes("password")
              }
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password:
                    event.target.value,
                }))
              }
            />
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </Button>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/forgot-password"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center font-semibold text-[var(--brand-navy)] transition-colors duration-200 hover:bg-[var(--brand-soft-lime)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2"
            >
              Forgot Password?
            </Link>

            <Link
              href="/register"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center font-semibold text-[var(--brand-navy)] transition-colors duration-200 hover:bg-[var(--brand-soft-lime)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2"
            >
              Register
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
