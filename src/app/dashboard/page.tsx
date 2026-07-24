"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [userId, setUserId] =
    useState<string | null>(null);

  useEffect(() => {
    setUserId(
      localStorage.getItem("userId")
    );
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">
        Dashboard
      </h1>

      <p className="mt-4">
        Logged in User ID:
        {" "}
        {userId ?? "Not logged in"}
      </p>
    </main>
  );
}