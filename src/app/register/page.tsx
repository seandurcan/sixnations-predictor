"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = form.password === form.confirmPassword;

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidMobile(mobile: string) {
    return /^[0-9+\s()-]{7,20}$/.test(mobile);
  }

  function passwordMeetsCriteria(password: string) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  function validateForm() {
    if (!form.firstName.trim()) {
      return "First name is required.";
    }

    if (!form.lastName.trim()) {
      return "Last name is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!isValidEmail(form.email)) {
      return "Enter a valid email address.";
    }

    if (!form.mobile.trim()) {
      return "Mobile number is required.";
    }

    if (!isValidMobile(form.mobile)) {
      return "Enter a valid mobile number.";
    }

    if (!form.password) {
      return "Password is required.";
    }

    if (!passwordMeetsCriteria(form.password)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }

    if (!form.confirmPassword) {
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
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Registration failed.");
        return;
      }

      setSuccess(
        "Registration successful. Please verify your email before logging in."
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
      });
    } catch {
      setError("Unable to connect. Please try again.");
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
            Register
          </h1>

          <p className="text-sm text-slate-600">
            Passwords must be at least 8 characters and include
            uppercase, lowercase, a number, and a special character.
          </p>

          {success && (
            <Alert
              variant="success"
              title="Registration Successful"
            >
              {success}
            </Alert>
          )}

          {error && (
            <Alert
              variant="error"
              title="Registration Failed"
            >
              {error}
            </Alert>
          )}

          <Input
            placeholder="First Name"
            value={form.firstName}
            disabled={loading}
            onChange={(e) =>
              setForm({
                ...form,
                firstName: e.target.value,
              })
            }
          />

          <Input
            placeholder="Last Name"
            value={form.lastName}
            disabled={loading}
            onChange={(e) =>
              setForm({
                ...form,
                lastName: e.target.value,
              })
            }
          />

          <Input
            type="text"
            placeholder="Email"
            value={form.email}
            disabled={loading}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <Input
            placeholder="Mobile"
            value={form.mobile}
            disabled={loading}
            onChange={(e) =>
              setForm({
                ...form,
                mobile: e.target.value,
              })
            }
          />

          <PasswordInput
            placeholder="Password"
            value={form.password}
            disabled={loading}
            showStrength
            showCriteria
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <PasswordInput
            placeholder="Confirm Password"
            value={form.confirmPassword}
            disabled={loading}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value,
              })
            }
          />

          {form.confirmPassword && !passwordsMatch && (
            <Alert
              variant="warning"
              title="Validation"
            >
              Passwords do not match.
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
      </Card>
    </main>
  );
}