"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { useEffect, useState } from "react";

type UnverifiedUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  createdAt: string;
  lastVerificationReminderAt: string | null;
};

type UnverifiedUsersResponse = {
  success: boolean;
  count?: number;
  users?: UnverifiedUser[];
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Dublin",
  }).format(new Date(value));
}

export default function UnverifiedUsersPage() {
  const [users, setUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/unverified-users", {
        cache: "no-store",
      });

      const data = (await response.json()) as UnverifiedUsersResponse;

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 403) {
          window.location.href = "/dashboard";
          return;
        }

        throw new Error(data.error || "Failed to load unverified users");
      }

      setUsers(data.users ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load unverified users"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Unverified Users"
          subtitle="Registered users who have not yet verified their email address"
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = "/admin/dashboard";
            }}
          >
            Back to Admin Dashboard
          </Button>
          <Button onClick={() => void loadUsers()}>
            Refresh List
          </Button>
        </div>

        <Card>
          {loading ? (
            <p>Loading unverified users...</p>
          ) : error ? (
            <p className="font-semibold text-red-700">{error}</p>
          ) : users.length === 0 ? (
            <p>There are no unverified users.</p>
          ) : (
            <>
              <p className="mb-4 font-semibold">
                Total unverified users: {users.length}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Mobile</th>
                      <th className="px-3 py-2">Registered</th>
                      <th className="px-3 py-2">Last Verification Reminder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200">
                        <td className="px-3 py-2">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-3 py-2">{user.email}</td>
                        <td className="px-3 py-2">{user.mobile}</td>
                        <td className="px-3 py-2">{formatDate(user.createdAt)}</td>
                        <td className="px-3 py-2">
                          {formatDate(user.lastVerificationReminderAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </PageContainer>
    </main>
  );
}
