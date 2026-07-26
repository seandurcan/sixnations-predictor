"use client";

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

  const passwordsMatch =
    form.password ===
    form.confirmPassword;

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!passwordsMatch) {
      return;
    }

    const response =
      await fetch(
        "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

    const result =
      await response.json();

    alert(
      JSON.stringify(result)
    );

    if (response.ok) {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
      });
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="border rounded p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold">
          Register
        </h1>

        <input
          className="border p-2 w-full"
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) =>
            setForm({
              ...form,
              firstName:
                e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) =>
            setForm({
              ...form,
              lastName:
                e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email:
                e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) =>
            setForm({
              ...form,
              mobile:
                e.target.value,
            })
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password:
                e.target.value,
            })
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({
              ...form,
              confirmPassword:
                e.target.value,
            })
          }
        />

        {form.confirmPassword &&
          !passwordsMatch && (
            <p className="text-red-600 text-sm">
              Passwords do not
              match
            </p>
          )}

        <button
          type="submit"
          disabled={
            !passwordsMatch ||
            !form.password ||
            !form.confirmPassword
          }
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Register
        </button>
      </form>
    </main>
  );
}