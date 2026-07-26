"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams =
    useSearchParams();

  const [message, setMessage] =
    useState("Verifying...");

  useEffect(() => {
    verify();
  }, []);

  async function verify() {
    const token =
      searchParams.get("token");

    if (!token) {
      setMessage(
        "Missing verification token."
      );
      return;
    }

    const response =
      await fetch(
        "/api/verify-email",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        }
      );

    const result =
      await response.json();

    if (result.success) {
      setMessage(
        "Email successfully verified."
      );
    } else {
      setMessage(
        result.error
      );
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="border rounded p-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">
          Email Verification
        </h1>

        <p>{message}</p>
      </div>
    </main>
  );
}