"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";

type UserRecord = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: "ADMIN" | "USER";
  emailVerified: boolean;
  announcementOptOutAt: string | null;
  createdAt: string;
  currentEntry: null | {
    status: "INVITED" | "ENTERED" | "WITHDRAWN";
    paymentStatus: string;
    predictionsSubmitted: boolean;
  };
};

type DirectoryResponse = {
  success: boolean;
  error?: string;
  users: UserRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  totals: { users: number; verified: number; currentEntrants: number; optedOut: number };
  currentCompetition: null | { id: number; year: number; name: string };
};

type Filters = {
  q: string;
  verification: "ALL" | "VERIFIED" | "UNVERIFIED";
  role: "ALL" | "ADMIN" | "USER";
  entry: "ALL" | "ENTERED" | "NOT_ENTERED";
  announcements: "ALL" | "SUBSCRIBED" | "OPTED_OUT";
};

type SupportAction = "RESEND_VERIFICATION" | "SEND_PASSWORD_RESET" | "DELETE_ACCOUNT";

type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

const EMPTY_FILTERS: Filters = {
  q: "",
  verification: "ALL",
  role: "ALL",
  entry: "ALL",
  announcements: "ALL",
};

async function requestDirectory(filters: Filters, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    q: filters.q,
    verification: filters.verification,
    role: filters.role,
    entry: filters.entry,
    announcements: filters.announcements,
    page: String(page),
  });
  const response = await fetch(`/api/admin/users?${params}`, {
    cache: "no-store",
    signal,
  });
  const data = await response.json() as DirectoryResponse;
  if (!response.ok) {
    const error = new Error(data.error ?? "Unable to load the user directory.");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Dublin",
  }).format(new Date(value));
}

function statusClasses(active: boolean, warning = false) {
  if (warning) return "border-amber-300 bg-amber-50 text-amber-900";
  return active
    ? "border-lime-300 bg-lime-50 text-slate-900"
    : "border-slate-300 bg-slate-100 text-slate-700";
}

export default function AdminUsersPage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<SupportAction | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void requestDirectory(EMPTY_FILTERS, 1, controller.signal)
      .then(setData)
      .catch((loadError: Error & { status?: number }) => {
        if (loadError.name === "AbortError") return;
        if (loadError.status === 401) { window.location.href = "/login"; return; }
        if (loadError.status === 403) { window.location.href = "/dashboard"; return; }
        setError(loadError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function loadUsers(filters: Filters, page: number) {
    setLoading(true);
    setError("");
    try {
      const result = await requestDirectory(filters, page);
      setData(result);
      setAppliedFilters(filters);
    } catch (loadError) {
      const typedError = loadError as Error & { status?: number };
      if (typedError.status === 401) { window.location.href = "/login"; return; }
      if (typedError.status === 403) { window.location.href = "/dashboard"; return; }
      setError(typedError.message);
    } finally {
      setLoading(false);
    }
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadUsers(draftFilters, 1);
  }

  function resetFilters() {
    setDraftFilters(EMPTY_FILTERS);
    void loadUsers(EMPTY_FILTERS, 1);
  }

  function closeSupportPanel() {
    if (actionLoading) return;
    setSelectedUser(null);
    setPendingAction(null);
    setConfirmationEmail("");
  }

  function chooseAction(action: SupportAction) {
    setPendingAction(action);
    setConfirmationEmail("");
    setError("");
    setNotice("");
  }

  function openSupportPanel(user: UserRecord) {
    setSelectedUser(user);
    setPendingAction(null);
    setConfirmationEmail("");
    setError("");
    setNotice("");
  }

  async function performSupportAction() {
    if (!selectedUser || !pendingAction) return;

    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      const deleting = pendingAction === "DELETE_ACCOUNT";
      const response = await fetch(
        deleting
          ? `/api/admin/users/${selectedUser.id}`
          : `/api/admin/users/${selectedUser.id}/actions`,
        {
          method: deleting ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            deleting
              ? { confirmationEmail }
              : { action: pendingAction }
          ),
        }
      );
      const result = await response.json() as ActionResponse;
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (response.status === 403) { window.location.href = "/dashboard"; return; }
      if (!response.ok) throw new Error(result.error ?? "The support action could not be completed.");

      setNotice(result.message ?? "The support action was completed.");
      setSelectedUser(null);
      setPendingAction(null);
      setConfirmationEmail("");
      if (deleting) {
        await loadUsers(appliedFilters, data?.pagination.page ?? 1);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The support action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  const competitionTitle = data?.currentCompetition
    ? `${data.currentCompetition.year} ${data.currentCompetition.name}`
    : "No current competition";

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader
          title="User Manager"
          subtitle="Account support and current competition overview"
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { window.location.href = "/admin/dashboard"; }}>
            Back to Admin Dashboard
          </Button>
          <Button variant="secondary" disabled={loading} onClick={() => void loadUsers(appliedFilters, data?.pagination.page ?? 1)}>
            Refresh
          </Button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Accounts" value={data?.totals.users ?? 0} tone="navy" />
          <StatCard title="Verified Accounts" value={data?.totals.verified ?? 0} tone="blue" />
          <StatCard title="Current Entrants" value={data?.totals.currentEntrants ?? 0} tone="lime" />
          <StatCard title="Announcement Opt-outs" value={data?.totals.optedOut ?? 0} tone="orange" />
        </div>

        <Card title="Search and Filters" className="mb-6">
          <form className="space-y-4" onSubmit={submitFilters}>
            <label className="block text-sm font-semibold">
              Name, email or mobile
              <Input
                className="mt-1"
                maxLength={120}
                placeholder="Search accounts"
                value={draftFilters.q}
                onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Verification" value={draftFilters.verification} onChange={(value) => setDraftFilters((current) => ({ ...current, verification: value as Filters["verification"] }))} options={[["ALL", "All"], ["VERIFIED", "Verified"], ["UNVERIFIED", "Unverified"]]} />
              <FilterSelect label="Role" value={draftFilters.role} onChange={(value) => setDraftFilters((current) => ({ ...current, role: value as Filters["role"] }))} options={[["ALL", "All"], ["ADMIN", "Administrators"], ["USER", "Users"]]} />
              <FilterSelect label="Current competition" value={draftFilters.entry} onChange={(value) => setDraftFilters((current) => ({ ...current, entry: value as Filters["entry"] }))} options={[["ALL", "All"], ["ENTERED", "Entered"], ["NOT_ENTERED", "Not entered"]]} />
              <FilterSelect label="Announcements" value={draftFilters.announcements} onChange={(value) => setDraftFilters((current) => ({ ...current, announcements: value as Filters["announcements"] }))} options={[["ALL", "All"], ["SUBSCRIBED", "Subscribed"], ["OPTED_OUT", "Opted out"]]} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>Apply Filters</Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={resetFilters}>Clear Filters</Button>
            </div>
          </form>
        </Card>

        <Card title="Accounts">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--brand-muted)]">
            <p>{competitionTitle}</p>
            <p>{data ? `${data.pagination.total} matching account${data.pagination.total === 1 ? "" : "s"}` : "Loading accounts..."}</p>
          </div>

          {notice ? <p className="mb-4 rounded-lg border border-lime-300 bg-lime-50 p-4 font-semibold text-slate-900">{notice}</p> : null}
          {error ? <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-800">{error}</p> : null}
          {loading && !data ? <p>Loading user directory...</p> : null}
          {!loading && data?.users.length === 0 ? <p>No accounts match the selected filters.</p> : null}

          {data && data.users.length > 0 ? (
            <div className={loading ? "opacity-60" : ""}>
              <div className="space-y-4 sm:hidden">
                {data.users.map((user) => (
                  <section key={user.id} className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-lg font-bold">{user.firstName} {user.lastName}</h3>
                    <p className="mt-1 break-all text-sm text-[var(--brand-muted)]">{user.email}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="font-semibold">Mobile</dt>
                        <dd>{user.mobile || "—"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Role</dt>
                        <dd className="mt-1"><StatusLabel active={user.role === "ADMIN"}>{user.role === "ADMIN" ? "Admin" : "User"}</StatusLabel></dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Verification</dt>
                        <dd className="mt-1"><StatusLabel active={user.emailVerified} warning={!user.emailVerified}>{user.emailVerified ? "Verified" : "Unverified"}</StatusLabel></dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Announcements</dt>
                        <dd className="mt-1"><StatusLabel active={!user.announcementOptOutAt} warning={Boolean(user.announcementOptOutAt)}>{user.announcementOptOutAt ? "Opted out" : "Subscribed"}</StatusLabel></dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Current Entry</dt>
                        <dd>{user.currentEntry?.status === "ENTERED" ? "Entered" : user.currentEntry?.status === "INVITED" ? "Invited" : user.currentEntry?.status === "WITHDRAWN" ? "Withdrawn" : "Not entered"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Registered</dt>
                        <dd>{formatDate(user.createdAt)}</dd>
                      </div>
                    </dl>
                    {user.currentEntry ? <p className="mt-3 text-xs text-[var(--brand-muted)]">Payment: {user.currentEntry.paymentStatus.toLowerCase()} · Predictions: {user.currentEntry.predictionsSubmitted ? "submitted" : "not submitted"}</p> : null}
                    <Button className="mt-4 w-full" variant="secondary" onClick={() => openSupportPanel(user)}>
                      Account Support
                    </Button>
                  </section>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Mobile</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Verification</th>
                      <th className="px-3 py-2">Current Entry</th>
                      <th className="px-3 py-2">Announcements</th>
                      <th className="px-3 py-2">Registered</th>
                      <th className="px-3 py-2">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200 align-top">
                        <td className="px-3 py-3 font-semibold">{user.firstName} {user.lastName}</td>
                        <td className="px-3 py-3">{user.email}</td>
                        <td className="px-3 py-3">{user.mobile || "—"}</td>
                        <td className="px-3 py-3"><StatusLabel active={user.role === "ADMIN"}>{user.role === "ADMIN" ? "Admin" : "User"}</StatusLabel></td>
                        <td className="px-3 py-3"><StatusLabel active={user.emailVerified} warning={!user.emailVerified}>{user.emailVerified ? "Verified" : "Unverified"}</StatusLabel></td>
                        <td className="px-3 py-3">
                          <p className="font-semibold">{user.currentEntry?.status === "ENTERED" ? "Entered" : user.currentEntry?.status === "INVITED" ? "Invited" : user.currentEntry?.status === "WITHDRAWN" ? "Withdrawn" : "Not entered"}</p>
                          {user.currentEntry ? <p className="mt-1 text-xs text-[var(--brand-muted)]">Payment: {user.currentEntry.paymentStatus.toLowerCase()} · Predictions: {user.currentEntry.predictionsSubmitted ? "submitted" : "not submitted"}</p> : null}
                        </td>
                        <td className="px-3 py-3"><StatusLabel active={!user.announcementOptOutAt} warning={Boolean(user.announcementOptOutAt)}>{user.announcementOptOutAt ? "Opted out" : "Subscribed"}</StatusLabel></td>
                        <td className="px-3 py-3">{formatDate(user.createdAt)}</td>
                        <td className="px-3 py-3">
                          <Button
                            variant="secondary"
                            onClick={() => openSupportPanel(user)}
                          >
                            Account Support
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--brand-muted)]">Page {data.pagination.page} of {data.pagination.totalPages}</p>
                <div className="flex gap-3">
                  <Button variant="secondary" disabled={loading || data.pagination.page <= 1} onClick={() => void loadUsers(appliedFilters, data.pagination.page - 1)}>Previous</Button>
                  <Button variant="secondary" disabled={loading || data.pagination.page >= data.pagination.totalPages} onClick={() => void loadUsers(appliedFilters, data.pagination.page + 1)}>Next</Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </PageContainer>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <section
            aria-labelledby="account-support-title"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="account-support-title" className="text-2xl font-bold">Account Support</h2>
                <p className="mt-1 font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="break-all text-sm text-[var(--brand-muted)]">{selectedUser.email}</p>
              </div>
              <Button variant="secondary" disabled={actionLoading} onClick={closeSupportPanel}>Close</Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                variant="secondary"
                disabled={selectedUser.emailVerified || actionLoading}
                onClick={() => chooseAction("RESEND_VERIFICATION")}
              >
                {selectedUser.emailVerified ? "Already Verified" : "Resend Verification"}
              </Button>
              <Button variant="secondary" disabled={actionLoading} onClick={() => chooseAction("SEND_PASSWORD_RESET")}>
                Send Password Reset
              </Button>
              <Button
                variant="secondary"
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={selectedUser.role === "ADMIN" || actionLoading}
                onClick={() => chooseAction("DELETE_ACCOUNT")}
              >
                {selectedUser.role === "ADMIN" ? "Admin Protected" : "Delete Account"}
              </Button>
            </div>

            {error ? <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-800">{error}</p> : null}

            {pendingAction ? (
              <div className={`mt-6 rounded-lg border p-4 ${pendingAction === "DELETE_ACCOUNT" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
                <h3 className="font-bold">{supportActionTitle(pendingAction)}</h3>
                <p className="mt-2 text-sm">{supportActionDescription(pendingAction)}</p>
                {pendingAction === "DELETE_ACCOUNT" ? (
                  <label className="mt-4 block text-sm font-semibold">
                    Enter the account email address to confirm
                    <Input
                      autoComplete="off"
                      className="mt-1"
                      value={confirmationEmail}
                      onChange={(event) => setConfirmationEmail(event.target.value)}
                    />
                  </label>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    className={pendingAction === "DELETE_ACCOUNT" ? "bg-red-700 hover:bg-red-800 focus:ring-red-700" : ""}
                    disabled={actionLoading || (pendingAction === "DELETE_ACCOUNT" && confirmationEmail.trim().toLowerCase() !== selectedUser.email.toLowerCase())}
                    onClick={() => void performSupportAction()}
                  >
                    {actionLoading ? "Working..." : supportActionConfirmLabel(pendingAction)}
                  </Button>
                  <Button variant="secondary" disabled={actionLoading} onClick={() => { setPendingAction(null); setConfirmationEmail(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function supportActionTitle(action: SupportAction) {
  if (action === "RESEND_VERIFICATION") return "Confirm verification email";
  if (action === "SEND_PASSWORD_RESET") return "Confirm password-reset email";
  return "Confirm account deletion";
}

function supportActionDescription(action: SupportAction) {
  if (action === "RESEND_VERIFICATION") return "A new one-hour verification link will be emailed to this user.";
  if (action === "SEND_PASSWORD_RESET") return "A secure one-hour password-reset link will be emailed to this user. Administrators cannot view or set the password.";
  return "This is irreversible. Login access and identifying details will be removed. Existing competition history will remain anonymously as Former Participant.";
}

function supportActionConfirmLabel(action: SupportAction) {
  if (action === "RESEND_VERIFICATION") return "Send Verification Email";
  if (action === "SEND_PASSWORD_RESET") return "Send Password Reset";
  return "Delete Account";
}

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function StatusLabel({ active, warning = false, children }: { active: boolean; warning?: boolean; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses(active, warning)}`}>{children}</span>;
}
