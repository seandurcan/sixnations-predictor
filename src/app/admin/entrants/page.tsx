"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";

type Tournament = { id: number; year: number; name: string; status: string };
type EntryStatus = "INVITED" | "ENTERED" | "WITHDRAWN";
type Entry = {
  id: number;
  status: EntryStatus;
  paymentStatus: string;
  paidAt: string | null;
  predictionsSubmitted: boolean;
  predictionSubmittedAt: string | null;
  predictionCount: number;
  createdAt: string;
  user: { id: number; firstName: string; lastName: string; email: string; mobile: string; emailVerified: boolean };
};
type Invitation = { id: number; email: string; firstName: string | null; lastName: string | null; mobile: string | null; status: string; expiresAt: string; invitedAt: string };
type Filters = { q: string; status: string; payment: string; verification: string; predictions: string };
type EntrantResponse = {
  success: boolean;
  error?: string;
  tournaments: Tournament[];
  tournament: Tournament | null;
  entries: Entry[];
  invitations: Invitation[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  totals: { invited: number; entered: number; withdrawn: number; pendingInvitations: number };
};

const EMPTY_FILTERS: Filters = { q: "", status: "ALL", payment: "ALL", verification: "ALL", predictions: "ALL" };

async function requestEntrants(tournamentId: number | null, filters: Filters, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ ...filters, page: String(page) });
  if (tournamentId) params.set("tournamentId", String(tournamentId));
  const response = await fetch(`/api/admin/entrants?${params}`, { cache: "no-store", signal });
  const result = await response.json() as EntrantResponse;
  if (!response.ok) {
    const error = new Error(result.error ?? "Unable to load competition entrants.");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return result;
}

export default function EntrantManagerPage() {
  const [data, setData] = useState<EntrantResponse | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [entryForm, setEntryForm] = useState({ email: "", firstName: "", lastName: "", mobile: "" });

  useEffect(() => {
    const controller = new AbortController();
    void requestEntrants(null, EMPTY_FILTERS, 1, controller.signal)
      .then((result) => { setData(result); setSelectedTournamentId(result.tournament?.id ?? null); })
      .catch((loadError: Error & { status?: number }) => {
        if (loadError.name === "AbortError") return;
        if (loadError.status === 401) { window.location.href = "/login"; return; }
        if (loadError.status === 403) { window.location.href = "/dashboard"; return; }
        setError(loadError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  function handleLoadError(loadError: unknown) {
    const typed = loadError as Error & { status?: number };
    if (typed.name === "AbortError") return;
    if (typed.status === 401) { window.location.href = "/login"; return; }
    if (typed.status === 403) { window.location.href = "/dashboard"; return; }
    setError(typed.message);
  }

  async function loadEntrants(tournamentId: number | null, filters: Filters, page: number) {
    setLoading(true);
    setError("");
    try {
      const result = await requestEntrants(tournamentId, filters, page);
      setData(result);
      setSelectedTournamentId(result.tournament?.id ?? tournamentId);
      setAppliedFilters(filters);
    } catch (loadError) {
      handleLoadError(loadError);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(body: Record<string, unknown>, confirmation: string) {
    if (!window.confirm(confirmation)) return;
    setActionLoading(true);
    setError(""); setNotice(""); setWarning("");
    try {
      const response = await fetch("/api/admin/entrants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, tournamentId: selectedTournamentId, confirmed: true }),
      });
      const result = await response.json() as { success: boolean; message?: string; warning?: string; error?: string };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (response.status === 403) { window.location.href = "/dashboard"; return; }
      if (!response.ok) throw new Error(result.error ?? "The entrant action could not be completed.");
      setNotice(result.message ?? "The entrant action was completed.");
      setWarning(result.warning ?? "");
      setEntryForm({ email: "", firstName: "", lastName: "", mobile: "" });
      await loadEntrants(selectedTournamentId, appliedFilters, data?.pagination.page ?? 1);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The entrant action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadEntrants(selectedTournamentId, draftFilters, 1);
  }

  function submitAccountAction(action: "ADD" | "INVITE") {
    const email = entryForm.email.trim();
    if (!email) { setError("Enter the person’s email address."); return; }
    const description = action === "ADD"
      ? `Add the existing account ${email} as an entered participant?`
      : `Invite ${email} to this competition? An invitation email will be sent.`;
    void runAction({ action, ...entryForm }, description);
  }

  const title = data?.tournament ? `${data.tournament.year} ${data.tournament.name}` : "No competition selected";

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader title="Competition Entrant Manager" subtitle="Invite, enter, withdraw and restore participants without changing their account or competition history" />
        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { window.location.href = "/admin/dashboard"; }}>Back to Admin Dashboard</Button>
          <Button variant="secondary" disabled={loading || actionLoading} onClick={() => void loadEntrants(selectedTournamentId, appliedFilters, data?.pagination.page ?? 1)}>Refresh</Button>
        </div>

        <Card title="Competition" className="mb-6">
          <label className="block max-w-xl text-sm font-semibold">
            Annual competition
            <select
              className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2"
              value={selectedTournamentId ?? ""}
              disabled={loading || actionLoading}
              onChange={(event) => {
                const id = Number(event.target.value);
                setSelectedTournamentId(id);
                setDraftFilters(EMPTY_FILTERS);
                void loadEntrants(id, EMPTY_FILTERS, 1);
              }}
            >
              {!data?.tournaments.length ? <option value="">No competitions available</option> : null}
              {data?.tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.year} {tournament.name} — {tournament.status.toLowerCase()}</option>)}
            </select>
          </label>
        </Card>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Entered" value={data?.totals.entered ?? 0} tone="lime" />
          <StatCard title="Invited Accounts" value={data?.totals.invited ?? 0} tone="blue" />
          <StatCard title="Pending Registrations" value={data?.totals.pendingInvitations ?? 0} tone="orange" />
          <StatCard title="Withdrawn" value={data?.totals.withdrawn ?? 0} tone="navy" />
        </div>

        {notice ? <p className="mb-4 rounded-lg border border-lime-300 bg-lime-50 p-4 font-semibold text-slate-900">{notice}</p> : null}
        {warning ? <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 font-semibold text-amber-900">{warning}</p> : null}
        {error ? <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-800">{error}</p> : null}

        <Card title="Add or Invite a Participant" className="mb-6">
          <p className="mb-4 text-sm text-[var(--brand-muted)]">Use <strong>Add Existing Account</strong> to enter a registered user immediately. Use <strong>Send Invitation</strong> for either an existing account or a person who still needs to register.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">Email address<Input className="mt-1" type="email" maxLength={254} value={entryForm.email} onChange={(event) => setEntryForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="block text-sm font-semibold">First name (new registrations)<Input className="mt-1" maxLength={60} value={entryForm.firstName} onChange={(event) => setEntryForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
            <label className="block text-sm font-semibold">Surname (new registrations)<Input className="mt-1" maxLength={80} value={entryForm.lastName} onChange={(event) => setEntryForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
            <label className="block text-sm font-semibold sm:col-span-2">Mobile (optional)<Input className="mt-1" maxLength={30} value={entryForm.mobile} onChange={(event) => setEntryForm((current) => ({ ...current, mobile: event.target.value }))} /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={!selectedTournamentId || actionLoading} onClick={() => submitAccountAction("ADD")}>Add Existing Account</Button>
            <Button variant="secondary" disabled={!selectedTournamentId || actionLoading} onClick={() => submitAccountAction("INVITE")}>Send Invitation</Button>
          </div>
        </Card>

        {data?.invitations.length ? (
          <Card title="Pending Registration Invitations" className="mb-6">
            <div className="space-y-3">
              {data.invitations.map((invitation) => (
                <section key={invitation.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-bold">{[invitation.firstName, invitation.lastName].filter(Boolean).join(" ") || "Invited participant"}</h3><p className="break-all text-sm text-[var(--brand-muted)]">{invitation.email}</p><p className="mt-1 text-xs text-[var(--brand-muted)]">Expires {formatDate(invitation.expiresAt)}</p></div>
                    <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={actionLoading} onClick={() => void runAction({ action: "RESEND_INVITATION", invitationId: invitation.id }, `Send a fresh registration invitation to ${invitation.email}?`)}>Resend</Button><Button variant="secondary" className="border-red-300 text-red-700 hover:bg-red-50" disabled={actionLoading} onClick={() => void runAction({ action: "CANCEL_INVITATION", invitationId: invitation.id }, `Cancel the pending invitation for ${invitation.email}?`)}>Cancel</Button></div>
                  </div>
                </section>
              ))}
            </div>
          </Card>
        ) : null}

        <Card title="Entrants">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{title}</p><p className="text-sm text-[var(--brand-muted)]">{data ? `${data.pagination.total} matching entrant${data.pagination.total === 1 ? "" : "s"}` : "Loading entrants..."}</p></div>
          <form className="mb-5 space-y-4 rounded-lg border border-slate-200 p-4" onSubmit={submitFilters}>
            <label className="block text-sm font-semibold">Name, email or mobile<Input className="mt-1" maxLength={120} value={draftFilters.q} onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))} /></label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Entry status" value={draftFilters.status} options={[["ALL", "All"], ["ENTERED", "Entered"], ["INVITED", "Invited"], ["WITHDRAWN", "Withdrawn"]]} onChange={(value) => setDraftFilters((current) => ({ ...current, status: value }))} />
              <FilterSelect label="Payment" value={draftFilters.payment} options={[["ALL", "All"], ["COMPLETED", "Paid"], ["PENDING", "Pending"], ["FAILED", "Failed"], ["REFUNDED", "Refunded"]]} onChange={(value) => setDraftFilters((current) => ({ ...current, payment: value }))} />
              <FilterSelect label="Verification" value={draftFilters.verification} options={[["ALL", "All"], ["VERIFIED", "Verified"], ["UNVERIFIED", "Unverified"]]} onChange={(value) => setDraftFilters((current) => ({ ...current, verification: value }))} />
              <FilterSelect label="Predictions" value={draftFilters.predictions} options={[["ALL", "All"], ["COMPLETE", "Complete"], ["INCOMPLETE", "In progress"], ["NOT_STARTED", "Not started"]]} onChange={(value) => setDraftFilters((current) => ({ ...current, predictions: value }))} />
            </div>
            <div className="flex flex-wrap gap-3"><Button type="submit" disabled={loading}>Apply Filters</Button><Button type="button" variant="secondary" disabled={loading} onClick={() => { setDraftFilters(EMPTY_FILTERS); void loadEntrants(selectedTournamentId, EMPTY_FILTERS, 1); }}>Clear Filters</Button></div>
          </form>

          {loading && !data ? <p>Loading competition entrants...</p> : null}
          {!loading && data?.entries.length === 0 ? <p>No entrants match the selected filters.</p> : null}
          {data?.entries.length ? (
            <div className={loading ? "opacity-60" : ""}>
              <div className="space-y-4 lg:hidden">{data.entries.map((entry) => <EntryCard key={entry.id} entry={entry} actionLoading={actionLoading} runAction={runAction} />)}</div>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-300"><th className="px-3 py-2">Participant</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Verification</th><th className="px-3 py-2">Payment</th><th className="px-3 py-2">Predictions</th><th className="px-3 py-2">Action</th></tr></thead><tbody>{data.entries.map((entry) => <EntryRow key={entry.id} entry={entry} actionLoading={actionLoading} runAction={runAction} />)}</tbody></table>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--brand-muted)]">Page {data.pagination.page} of {data.pagination.totalPages}</p><div className="flex gap-3"><Button variant="secondary" disabled={loading || data.pagination.page <= 1} onClick={() => void loadEntrants(selectedTournamentId, appliedFilters, data.pagination.page - 1)}>Previous</Button><Button variant="secondary" disabled={loading || data.pagination.page >= data.pagination.totalPages} onClick={() => void loadEntrants(selectedTournamentId, appliedFilters, data.pagination.page + 1)}>Next</Button></div></div>
            </div>
          ) : null}
        </Card>
      </PageContainer>
    </main>
  );
}

function EntryCard({ entry, actionLoading, runAction }: EntryViewProps) {
  return <section className="rounded-lg border border-slate-200 p-4"><h3 className="text-lg font-bold">{entry.user.firstName} {entry.user.lastName}</h3><p className="break-all text-sm text-[var(--brand-muted)]">{entry.user.email}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><StatusDetails entry={entry} /></dl><EntryAction entry={entry} actionLoading={actionLoading} runAction={runAction} className="mt-4 w-full" /></section>;
}

function EntryRow({ entry, actionLoading, runAction }: EntryViewProps) {
  return <tr className="border-b border-slate-200 align-top"><td className="px-3 py-3"><p className="font-semibold">{entry.user.firstName} {entry.user.lastName}</p><p className="break-all text-xs text-[var(--brand-muted)]">{entry.user.email}</p><p className="text-xs text-[var(--brand-muted)]">{entry.user.mobile || "No mobile"}</p></td><td className="px-3 py-3"><Badge value={entry.status} /></td><td className="px-3 py-3"><Badge value={entry.user.emailVerified ? "VERIFIED" : "UNVERIFIED"} /></td><td className="px-3 py-3"><Badge value={entry.paymentStatus} /></td><td className="px-3 py-3"><p className="font-semibold">{entry.predictionsSubmitted ? "Complete" : entry.predictionCount ? "In progress" : "Not started"}</p><p className="text-xs text-[var(--brand-muted)]">{entry.predictionCount} saved</p></td><td className="px-3 py-3"><EntryAction entry={entry} actionLoading={actionLoading} runAction={runAction} /></td></tr>;
}

function StatusDetails({ entry }: { entry: Entry }) {
  return <><div><dt className="font-semibold">Entry</dt><dd><Badge value={entry.status} /></dd></div><div><dt className="font-semibold">Email</dt><dd><Badge value={entry.user.emailVerified ? "VERIFIED" : "UNVERIFIED"} /></dd></div><div><dt className="font-semibold">Payment</dt><dd><Badge value={entry.paymentStatus} /></dd></div><div><dt className="font-semibold">Predictions</dt><dd>{entry.predictionsSubmitted ? "Complete" : entry.predictionCount ? `In progress (${entry.predictionCount})` : "Not started"}</dd></div></>;
}

type EntryViewProps = { entry: Entry; actionLoading: boolean; runAction: (body: Record<string, unknown>, confirmation: string) => Promise<void> };
function EntryAction({ entry, actionLoading, runAction, className = "" }: EntryViewProps & { className?: string }) {
  const restoring = entry.status === "WITHDRAWN";
  return <Button variant="secondary" className={`${restoring ? "" : "border-red-300 text-red-700 hover:bg-red-50"} ${className}`} disabled={actionLoading} onClick={() => void runAction({ action: restoring ? "RESTORE" : "WITHDRAW", entryId: entry.id }, restoring ? `Restore ${entry.user.firstName} ${entry.user.lastName} to this competition?` : `Withdraw ${entry.user.firstName} ${entry.user.lastName}? Their account, payment and competition history will be preserved.`)}>{restoring ? "Restore Entrant" : "Withdraw Entrant"}</Button>;
}

function Badge({ value }: { value: string }) {
  const positive = ["ENTERED", "COMPLETED", "VERIFIED"].includes(value);
  const warning = ["INVITED", "PENDING", "UNVERIFIED"].includes(value);
  const classes = positive ? "border-lime-300 bg-lime-50 text-slate-900" : warning ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-300 bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${classes}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</span>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IE", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Dublin" }).format(new Date(value));
}
