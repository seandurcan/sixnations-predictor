"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
  });

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const response = await fetch(
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

    alert(JSON.stringify(result));
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
          onChange={(e) =>
            setForm({
              ...form,
              firstName: e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Last Name"
          onChange={(e) =>
            setForm({
              ...form,
              lastName: e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Email"
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Mobile"
          onChange={(e) =>
            setForm({
              ...form,
              mobile: e.target.value,
            })
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Register
        </button>
      </form>
    </main>
  );
}