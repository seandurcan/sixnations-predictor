"use client";

import { FormEvent, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type Account = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
};

type AccountResponse = {
  success: boolean;
  user?: Account;
  message?: string;
  warning?: string;
  error?: string;
};

export default function AccountPage() {
  const [original, setOriginal] = useState<Account | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", mobile: "", currentPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/account", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as AccountResponse;
        if (response.status === 401) { window.location.href = "/login"; return; }
        if (!response.ok || !result.user) throw new Error(result.error ?? "Unable to load your account details.");
        setOriginal(result.user);
        setForm({
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          mobile: result.user.mobile,
          currentPassword: "",
        });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load your account details."))
      .finally(() => setLoading(false));
  }, []);

  const emailChanged = Boolean(original)
    && form.email.trim().toLowerCase() !== original?.email.toLowerCase();
  const unchanged = Boolean(original)
    && form.firstName.trim() === original?.firstName
    && form.lastName.trim() === original?.lastName
    && form.mobile.trim() === original?.mobile
    && !emailChanged;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setWarning("");
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json() as AccountResponse;
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok || !result.user) throw new Error(result.error ?? "Your account details could not be saved.");
      setOriginal(result.user);
      setForm((current) => ({ ...current, ...result.user!, currentPassword: "" }));
      setMessage(result.warning ? "Your account details were saved." : result.message ?? "Your account details were saved.");
      setWarning(result.warning ?? "");
      window.dispatchEvent(new CustomEvent("perfect-xv-user-updated", { detail: result.user }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your account details could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader title="My Account" subtitle="Keep your contact details accurate" />
        <div className="mx-auto max-w-2xl">
          <Card title="Account Details">
            {loading ? <p>Loading your account details...</p> : null}
            {message ? <Alert variant="success" className="mb-4">{message}</Alert> : null}
            {warning ? <Alert variant="warning" className="mb-4">{warning}</Alert> : null}
            {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}
            {!loading && original ? (
              <form className="space-y-4" onSubmit={save}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">First name<Input className="mt-1" maxLength={60} required value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
                  <label className="block text-sm font-semibold">Surname<Input className="mt-1" maxLength={80} required value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
                </div>
                <label className="block text-sm font-semibold">Mobile number (optional)<Input className="mt-1" inputMode="tel" maxLength={30} value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} /></label>
                <label className="block text-sm font-semibold">Email address<Input className="mt-1" maxLength={254} required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
                {emailChanged ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <label className="block text-sm font-semibold">Current password<Input autoComplete="current-password" className="mt-1" required type="password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
                    <p className="mt-3 text-sm">Changing your email requires fresh verification. Existing verification, password-reset and unsubscribe links will stop working, but your competition records and password will remain unchanged.</p>
                  </div>
                ) : null}
                <Alert variant="info">This form cannot change your role, password, payments, competition entries, predictions or results.</Alert>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={saving || unchanged || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || (emailChanged && !form.currentPassword)}>{saving ? "Saving..." : "Save Account Details"}</Button>
                  <Button type="button" variant="secondary" disabled={saving || unchanged} onClick={() => setForm({ firstName: original.firstName, lastName: original.lastName, email: original.email, mobile: original.mobile, currentPassword: "" })}>Discard Changes</Button>
                </div>
              </form>
            ) : null}
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
