"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response =
      await fetch(
        "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

    const result =
      await response.json();

    alert(
      JSON.stringify(result)
    );

    if (result.success) {
      localStorage.setItem(
        "userId",
        result.userId
      );

      window.location.href =
        "/dashboard";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="border rounded p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold">
          Login
        </h1>

        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login
        </button>

        <button
          type="button"
          className="text-blue-600 underline text-sm block"
          onClick={() => {
            window.location.href =
              "/forgot-password";
          }}
        >
          Forgot Password?
        </button>

        <button
          type="button"
          className="text-blue-600 underline text-sm block"
          onClick={() => {
            window.location.href =
              "/register";
          }}
        >
          Create Account
        </button>
      </form>
    </main>
  );
}