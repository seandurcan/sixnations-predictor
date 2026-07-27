"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  useEffect(() => {
    const urlToken =
      searchParams.get("token");

    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const passwordsMatch =
    password === confirmPassword;

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response =
      await fetch(
        "/api/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

    const result =
      await response.json();

    alert(
      JSON.stringify(result)
    );

    if (result.success) {
      window.location.href =
        "/login";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="border rounded p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold">
          Reset Password
        </h1>

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="New Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
        />

        {confirmPassword &&
          !passwordsMatch && (
            <p className="text-red-600 text-sm">
              Passwords do not match
            </p>
          )}

        <button
          type="submit"
          disabled={
            !password ||
            !confirmPassword ||
            !passwordsMatch
          }
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Reset Password
        </button>
      </form>
    </main>
  );
}