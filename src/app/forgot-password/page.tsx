"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    console.log(
      "Forgot Password clicked"
    );

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

    alert(
      JSON.stringify(result)
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="border rounded p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-600">
          Enter your email address and
          we'll send you a password reset
          link.
        </p>

        <input
          type="email"
          className="border p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send Reset Link
        </button>
      </form>
    </main>
  );
}