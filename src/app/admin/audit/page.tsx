"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/ui/StatCard";
import { formatIrishDate } from "@/lib/formatIrishDate";

type Filters = {
  q: string;
  category: "ALL" | "RESULT" | "ACCOUNT";
  action: "ALL" | "RESULT_CHANGED" | "CORRECT_ACCOUNT" | "DUPLICATE_REVIEW" | "MERGE_ACCOUNTS" | "RESEND_PREDICTION_CONFIRMATION" | "RESEND_VERIFICATION" | "SEND_PASSWORD_RESET" | "DELETE_ACCOUNT";
  status: "ALL" | "SUCCEEDED" | "FAILED";
  from: string;
  to: string;
};

type AuditRecord = {
  id: string;
  category: "RESULT" | "ACCOUNT";
  action: string;
  status: string;
  createdAt: string;
  admin: { id: number; name: string };
  target: { id: number; label: string; previous?: string; current?: string };
  detail: string | null;
};

type AuditResponse = {
  success: boolean;
  error?: string;
  records: AuditRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  totals: { resultChanges: number; accountActions: number };
};

const EMPTY_FILTERS: Filters = {
  q: "",
  category: "ALL",
  action: "ALL",
  status: "ALL",
  from: "",
  to: "",
};

async function requestAudit(filters: Filters, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ ...filters, page: String(page) });
  const response = await fetch(`/api/admin/audit?${params}`, { cache: "no-store", signal });
  const result = await response.json() as AuditResponse;
  if (!response.ok) {
    const error = new Error(result.error ?? "Unable to load audit history.");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return result;
}

export default function AuditPage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void requestAudit(EMPTY_FILTERS, 1, controller.signal)
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

  async function loadAudit(filters: Filters, page: number) {
    setLoading(true);
    setError("");
    try {
      const result = await requestAudit(filters, page);
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
    void loadAudit(draftFilters, 1);
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    void loadAudit(EMPTY_FILTERS, 1);
  }

  const records = data?.records ?? [];

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader
          title="Audit History"
          subtitle="Read-only history of result changes and account-support actions"
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { window.location.href = "/admin/dashboard"; }}>
            Back to Admin Dashboard
          </Button>
          <Button variant="secondary" disabled={loading} onClick={() => void loadAudit(appliedFilters, data?.pagination.page ?? 1)}>
            Refresh
          </Button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard title="Matching Records" value={data?.pagination.total ?? 0} tone="navy" />
          <StatCard title="Result Changes" value={data?.totals.resultChanges ?? 0} tone="blue" />
          <StatCard title="Account Actions" value={data?.totals.accountActions ?? 0} tone="lime" />
        </div>

        <Card title="Search and Filters" className="mb-6">
          <form className="space-y-4" onSubmit={submitFilters}>
            <label className="block text-sm font-semibold">
              Administrator, user, account number, match or team
              <Input
                className="mt-1"
                maxLength={100}
                placeholder="Search audit history"
                value={draftFilters.q}
                onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <FilterSelect label="Category" value={draftFilters.category} onChange={(value) => setDraftFilters((current) => ({ ...current, category: value as Filters["category"] }))} options={[["ALL", "All"], ["RESULT", "Result changes"], ["ACCOUNT", "Account support"]]} />
              <FilterSelect label="Action" value={draftFilters.action} onChange={(value) => setDraftFilters((current) => ({ ...current, action: value as Filters["action"] }))} options={[["ALL", "All"], ["RESULT_CHANGED", "Result changed"], ["CORRECT_ACCOUNT", "Account correction"], ["DUPLICATE_REVIEW", "Duplicate review"], ["MERGE_ACCOUNTS", "Account merge"], ["RESEND_PREDICTION_CONFIRMATION", "Prediction confirmation resend"], ["RESEND_VERIFICATION", "Verification email"], ["SEND_PASSWORD_RESET", "Password reset"], ["DELETE_ACCOUNT", "Account deletion"]]} />
              <FilterSelect label="Status" value={draftFilters.status} onChange={(value) => setDraftFilters((current) => ({ ...current, status: value as Filters["status"] }))} options={[["ALL", "All"], ["SUCCEEDED", "Succeeded"], ["FAILED", "Failed"]]} />
              <label className="block text-sm font-semibold">From<Input className="mt-1" type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} /></label>
              <label className="block text-sm font-semibold">To<Input className="mt-1" type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} /></label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>Apply Filters</Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={clearFilters}>Clear Filters</Button>
            </div>
          </form>
        </Card>

        <Card title="Audit Records">
          {error ? <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-800">{error}</p> : null}
          {loading && !data ? <p>Loading audit history...</p> : null}
          {!loading && records.length === 0 ? <p>No audit records match the selected filters.</p> : null}

          {records.length > 0 ? (
            <div className={loading ? "opacity-60" : ""}>
              <div className="space-y-4 md:hidden">
                {records.map((record) => <AuditCard key={record.id} record={record} />)}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead><tr className="border-b border-slate-300"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Administrator</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Details</th></tr></thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-slate-200 align-top">
                        <td className="px-3 py-3 whitespace-nowrap">{formatIrishDate(record.createdAt)}</td>
                        <td className="px-3 py-3">{categoryLabel(record.category)}</td>
                        <td className="px-3 py-3 font-semibold">{actionLabel(record.action)}</td>
                        <td className="px-3 py-3"><Target record={record} /></td>
                        <td className="px-3 py-3">{record.admin.name}</td>
                        <td className="px-3 py-3"><Status status={record.status} /></td>
                        <td className="px-3 py-3 text-[var(--brand-muted)]">{record.detail ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--brand-muted)]">Page {data?.pagination.page ?? 1} of {data?.pagination.totalPages ?? 1}</p>
                <div className="flex gap-3">
                  <Button variant="secondary" disabled={loading || (data?.pagination.page ?? 1) <= 1} onClick={() => void loadAudit(appliedFilters, (data?.pagination.page ?? 1) - 1)}>Previous</Button>
                  <Button variant="secondary" disabled={loading || (data?.pagination.page ?? 1) >= (data?.pagination.totalPages ?? 1)} onClick={() => void loadAudit(appliedFilters, (data?.pagination.page ?? 1) + 1)}>Next</Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </PageContainer>
    </main>
  );
}

function AuditCard({ record }: { record: AuditRecord }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">{categoryLabel(record.category)}</p><h3 className="mt-1 text-lg font-bold">{actionLabel(record.action)}</h3></div><Status status={record.status} /></div>
      <div className="mt-4"><Target record={record} /></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="font-semibold">Administrator</dt><dd>{record.admin.name}</dd></div><div><dt className="font-semibold">Date</dt><dd>{formatIrishDate(record.createdAt)}</dd></div></dl>
      {record.detail ? <p className="mt-4 text-sm text-[var(--brand-muted)]">{record.detail}</p> : null}
    </section>
  );
}

function Target({ record }: { record: AuditRecord }) {
  return <div><p className="font-semibold">{record.target.label}</p>{record.target.previous !== undefined ? <p className="mt-1 text-sm text-[var(--brand-muted)]">{record.target.previous} → <span className="font-semibold text-[var(--brand-navy)]">{record.target.current}</span></p> : <p className="mt-1 text-xs text-[var(--brand-muted)]">Account {record.target.id}</p>}</div>;
}

function Status({ status }: { status: string }) {
  const failed = status === "FAILED";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${failed ? "border-red-300 bg-red-50 text-red-800" : "border-lime-300 bg-lime-50 text-slate-900"}`}>{failed ? "Failed" : "Succeeded"}</span>;
}

function categoryLabel(category: AuditRecord["category"]) {
  return category === "RESULT" ? "Result change" : "Account support";
}

function actionLabel(action: string) {
  if (action === "RESULT_CHANGED") return "Result changed";
  if (action === "CORRECT_ACCOUNT") return "Account corrected";
  if (action === "DUPLICATE_REVIEW") return "Duplicate review";
  if (action === "MERGE_ACCOUNTS") return "Accounts merged";
  if (action === "RESEND_PREDICTION_CONFIRMATION") return "Prediction confirmation resent";
  if (action === "RESEND_VERIFICATION") return "Verification email";
  if (action === "SEND_PASSWORD_RESET") return "Password reset email";
  if (action === "DELETE_ACCOUNT") return "Account deleted";
  return action.replaceAll("_", " ").toLowerCase();
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
