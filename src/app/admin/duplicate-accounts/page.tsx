"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { formatIrishDate } from "@/lib/formatIrishDate";

type Decision = "UNREVIEWED" | "SAME_PERSON" | "NOT_DUPLICATE";
type Account = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: "ADMIN" | "USER";
  emailVerified: boolean;
  createdAt: string;
  competitionEntries: Array<{
    status: string;
    paymentStatus: string;
    predictionsSubmitted: boolean;
    tournament: { id: number; year: number; name: string };
  }>;
  _count: { predictions: number; payments: number; submissions: number; competitionEntries: number };
};
type Candidate = {
  lowerUser: Account;
  higherUser: Account;
  reasons: Array<"EMAIL" | "MOBILE" | "EXACT_NAME" | "SIMILAR_NAME">;
  decision: Decision;
  reviewedAt: string | null;
  reviewedById: number | null;
};
type ResponseData = {
  success: boolean;
  error?: string;
  message?: string;
  candidates: Candidate[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  totals: { all: number; unreviewed: number; samePerson: number; notDuplicate: number };
};
type MergePreview = {
  survivor: Account;
  redundant: Account;
  conflicts: { predictions: number; competitionEntries: number; leaderboardSnapshots: number; tournamentWins: number; predictionConfirmations: number };
  transfers: { predictions: number; competitionEntries: number; payments: number; submissions: number; leaderboardSnapshots: number; tournamentWins: number; predictionConfirmations: number };
};

async function requestCandidates(filter: Decision, page: number, signal?: AbortSignal) {
  const response = await fetch(`/api/admin/duplicate-accounts?decision=${filter}&page=${page}`, { cache: "no-store", signal });
  const result = await response.json() as ResponseData;
  if (!response.ok) {
    const error = new Error(result.error ?? "Unable to load duplicate account candidates.");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return result;
}

export default function DuplicateAccountsPage() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<Decision>("UNREVIEWED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<{ candidate: Candidate; decision: Exclude<Decision, "UNREVIEWED"> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [mergeCandidate, setMergeCandidate] = useState<Candidate | null>(null);
  const [survivorUserId, setSurvivorUserId] = useState<number | null>(null);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [conflictResolution, setConflictResolution] = useState<"KEEP_SURVIVOR" | "KEEP_REDUNDANT">("KEEP_SURVIVOR");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  async function load(filter: Decision, page = 1) {
    setLoading(true);
    setError("");
    try {
      const result = await requestCandidates(filter, page);
      setData(result);
      setDecisionFilter(filter);
    } catch (loadError) {
      const typedError = loadError as Error & { status?: number };
      if (typedError.status === 401) { window.location.href = "/login"; return; }
      if (typedError.status === 403) { window.location.href = "/dashboard"; return; }
      setError(typedError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void requestCandidates("UNREVIEWED", 1, controller.signal)
      .then((result) => {
        setData(result);
        setDecisionFilter("UNREVIEWED");
      })
      .catch((loadError: Error & { status?: number }) => {
        if (loadError.name === "AbortError") return;
        if (loadError.status === 401) { window.location.href = "/login"; return; }
        if (loadError.status === 403) { window.location.href = "/dashboard"; return; }
        setError(loadError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function confirmDecision() {
    if (!pending) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/duplicate-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstUserId: pending.candidate.lowerUser.id,
          secondUserId: pending.candidate.higherUser.id,
          decision: pending.decision,
        }),
      });
      const result = await response.json() as { success: boolean; message?: string; error?: string };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (response.status === 403) { window.location.href = "/dashboard"; return; }
      if (!response.ok) throw new Error(result.error ?? "The review decision could not be saved.");
      setNotice(result.message ?? "Review decision saved.");
      setPending(null);
      await load(decisionFilter, data?.pagination.page ?? 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The review decision could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function previewMerge(candidate: Candidate, survivorId: number) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/duplicate-accounts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", firstUserId: candidate.lowerUser.id, secondUserId: candidate.higherUser.id, survivorUserId: survivorId }),
      });
      const result = await response.json() as { success: boolean; preview?: MergePreview; error?: string };
      if (!response.ok || !result.preview) throw new Error(result.error ?? "The merge preview could not be generated.");
      setMergeCandidate(candidate);
      setSurvivorUserId(survivorId);
      setMergePreview(result.preview);
      setConfirmationEmail("");
      setConflictResolution("KEEP_SURVIVOR");
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : "The merge preview could not be generated.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmMerge() {
    if (!mergeCandidate || !survivorUserId || !mergePreview) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/duplicate-accounts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "merge",
          firstUserId: mergeCandidate.lowerUser.id,
          secondUserId: mergeCandidate.higherUser.id,
          survivorUserId,
          conflictResolution,
          confirmationEmail,
        }),
      });
      const result = await response.json() as { success: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "The accounts could not be merged.");
      setNotice(result.message ?? "Accounts merged.");
      setMergeCandidate(null);
      setMergePreview(null);
      await load(decisionFilter, 1);
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : "The accounts could not be merged.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader title="Duplicate Account Review" subtitle="Review possible matches without changing user accounts" />
        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { window.location.href = "/admin/dashboard"; }}>Back to Admin Dashboard</Button>
          <Button variant="secondary" disabled={loading} onClick={() => void load(decisionFilter, data?.pagination.page ?? 1)}>Refresh</Button>
        </div>
        <Alert variant="info" className="mb-6">Review candidates first. Only pairs marked as the same person can be merged, and every merge requires a preview, a surviving account, a conflict rule and typed email confirmation.</Alert>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Possible Matches" value={data?.totals.all ?? 0} tone="navy" />
          <StatCard title="Awaiting Review" value={data?.totals.unreviewed ?? 0} tone="orange" />
          <StatCard title="Same Person" value={data?.totals.samePerson ?? 0} tone="blue" />
          <StatCard title="Not Duplicates" value={data?.totals.notDuplicate ?? 0} tone="lime" />
        </div>
        <Card title="Review Filter" className="mb-6">
          <div className="flex flex-wrap gap-3">
            {(["UNREVIEWED", "SAME_PERSON", "NOT_DUPLICATE"] as Decision[]).map((decision) => (
              <Button key={decision} variant={decisionFilter === decision ? "primary" : "secondary"} disabled={loading} onClick={() => void load(decision, 1)}>{decisionLabel(decision)}</Button>
            ))}
          </div>
        </Card>
        {notice ? <Alert variant="success" className="mb-6">{notice}</Alert> : null}
        {error ? <Alert variant="error" className="mb-6">{error}</Alert> : null}
        {loading && !data ? <p>Loading possible duplicate accounts...</p> : null}
        {!loading && data?.candidates.length === 0 ? <Card>No account pairs match this review filter.</Card> : null}
        <div className={loading ? "space-y-6 opacity-60" : "space-y-6"}>
          {data?.candidates.map((candidate) => (
            <Card key={`${candidate.lowerUser.id}:${candidate.higherUser.id}`} title={`Accounts ${candidate.lowerUser.id} and ${candidate.higherUser.id}`}>
              <div className="mb-4 flex flex-wrap gap-2">
                {candidate.reasons.map((reason) => <span key={reason} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold">{reasonLabel(reason)}</span>)}
                {candidate.decision !== "UNREVIEWED" ? <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold">{decisionLabel(candidate.decision)}</span> : null}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AccountSummary account={candidate.lowerUser} />
                <AccountSummary account={candidate.higherUser} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button disabled={saving} onClick={() => setPending({ candidate, decision: "SAME_PERSON" })}>Mark as Same Person</Button>
                <Button variant="secondary" disabled={saving} onClick={() => setPending({ candidate, decision: "NOT_DUPLICATE" })}>Mark as Not Duplicates</Button>
                {candidate.decision === "SAME_PERSON" && candidate.lowerUser.role !== "ADMIN" && candidate.higherUser.role !== "ADMIN" ? (
                  <>
                    <Button variant="secondary" disabled={saving} onClick={() => void previewMerge(candidate, candidate.lowerUser.id)}>Merge into account {candidate.lowerUser.id}</Button>
                    <Button variant="secondary" disabled={saving} onClick={() => void previewMerge(candidate, candidate.higherUser.id)}>Merge into account {candidate.higherUser.id}</Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
        {data && data.pagination.total > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--brand-muted)]">Page {data.pagination.page} of {data.pagination.totalPages}</p>
            <div className="flex gap-3">
              <Button variant="secondary" disabled={loading || data.pagination.page <= 1} onClick={() => void load(decisionFilter, data.pagination.page - 1)}>Previous</Button>
              <Button variant="secondary" disabled={loading || data.pagination.page >= data.pagination.totalPages} onClick={() => void load(decisionFilter, data.pagination.page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </PageContainer>

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <section aria-labelledby="duplicate-confirm-title" aria-modal="true" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" role="dialog">
            <h2 id="duplicate-confirm-title" className="text-xl font-bold">Confirm review decision</h2>
            <p className="mt-3">Mark accounts {pending.candidate.lowerUser.id} and {pending.candidate.higherUser.id} as <strong>{decisionLabel(pending.decision).toLowerCase()}</strong>?</p>
            <p className="mt-3 text-sm text-[var(--brand-muted)]">This records the decision in Audit History. It does not merge or change either account.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button disabled={saving} onClick={() => void confirmDecision()}>{saving ? "Saving..." : "Confirm Decision"}</Button>
              <Button variant="secondary" disabled={saving} onClick={() => setPending(null)}>Cancel</Button>
            </div>
          </section>
        </div>
      ) : null}

      {mergePreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" role="presentation">
          <section aria-labelledby="merge-confirm-title" aria-modal="true" className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl" role="dialog">
            <h2 id="merge-confirm-title" className="text-xl font-bold">Confirm irreversible account merge</h2>
            <p className="mt-3">Account <strong>{mergePreview.survivor.id}</strong> ({mergePreview.survivor.email}) will survive. Account <strong>{mergePreview.redundant.id}</strong> will be anonymised and its login disabled.</p>
            <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              <p>Predictions transferred: <strong>{mergePreview.transfers.predictions}</strong></p>
              <p>Competition entries transferred: <strong>{mergePreview.transfers.competitionEntries}</strong></p>
              <p>Payments transferred: <strong>{mergePreview.transfers.payments}</strong></p>
              <p>Submission receipts transferred: <strong>{mergePreview.transfers.submissions}</strong></p>
              <p>Prediction conflicts: <strong>{mergePreview.conflicts.predictions}</strong></p>
              <p>Entry conflicts: <strong>{mergePreview.conflicts.competitionEntries}</strong></p>
              <p>Leaderboard snapshot conflicts: <strong>{mergePreview.conflicts.leaderboardSnapshots}</strong></p>
              <p>Tournament-winner conflicts: <strong>{mergePreview.conflicts.tournamentWins}</strong></p>
              <p>Prior confirmation conflicts: <strong>{mergePreview.conflicts.predictionConfirmations}</strong></p>
            </div>
            <label className="mt-4 block text-sm font-semibold" htmlFor="merge-conflict-rule">When both accounts have the same record</label>
            <select id="merge-conflict-rule" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={conflictResolution} onChange={(event) => setConflictResolution(event.target.value as "KEEP_SURVIVOR" | "KEEP_REDUNDANT")}>
              <option value="KEEP_SURVIVOR">Keep the surviving account&apos;s record</option>
              <option value="KEEP_REDUNDANT">Keep the redundant account&apos;s record</option>
            </select>
            <label className="mt-4 block text-sm font-semibold" htmlFor="merge-confirm-email">Type the surviving email exactly: {mergePreview.survivor.email}</label>
            <input id="merge-confirm-email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" autoComplete="off" value={confirmationEmail} onChange={(event) => setConfirmationEmail(event.target.value)} />
            <Alert variant="error" className="mt-4">This cannot be undone. The surviving password and verification status are retained; the redundant account is disabled.</Alert>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button disabled={saving || confirmationEmail.trim().toLowerCase() !== mergePreview.survivor.email.toLowerCase()} onClick={() => void confirmMerge()}>{saving ? "Merging..." : "Merge Accounts"}</Button>
              <Button variant="secondary" disabled={saving} onClick={() => { setMergeCandidate(null); setMergePreview(null); }}>Cancel</Button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function AccountSummary({ account }: { account: Account }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="text-lg font-bold">{account.firstName} {account.lastName}</h3><p className="text-xs text-[var(--brand-muted)]">Account {account.id} · Registered {formatIrishDate(account.createdAt)}</p></div>
        {account.role === "ADMIN" ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Administrator</span> : null}
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Email</dt><dd className="break-all">{account.email}</dd></div>
        <div><dt className="font-semibold">Mobile</dt><dd>{account.mobile || "—"}</dd></div>
        <div><dt className="font-semibold">Verification</dt><dd>{account.emailVerified ? "Verified" : "Unverified"}</dd></div>
        <div><dt className="font-semibold">History</dt><dd>{account._count.competitionEntries} entries · {account._count.predictions} predictions · {account._count.payments} payments</dd></div>
      </dl>
      <div className="mt-4 border-t border-slate-200 pt-3">
        <h4 className="text-sm font-semibold">Competition entries</h4>
        {account.competitionEntries.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {account.competitionEntries.map((entry) => <li key={entry.tournament.id}>{entry.tournament.year} {entry.tournament.name}: {entry.status.toLowerCase()}, payment {entry.paymentStatus.toLowerCase()}, predictions {entry.predictionsSubmitted ? "submitted" : "not submitted"}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-[var(--brand-muted)]">No competition entries.</p>}
      </div>
    </section>
  );
}

function reasonLabel(reason: Candidate["reasons"][number]) {
  if (reason === "EMAIL") return "Same email";
  if (reason === "MOBILE") return "Same mobile";
  if (reason === "EXACT_NAME") return "Same name";
  return "Similar name";
}

function decisionLabel(decision: Decision) {
  if (decision === "SAME_PERSON") return "Same Person";
  if (decision === "NOT_DUPLICATE") return "Not Duplicates";
  return "Awaiting Review";
}
