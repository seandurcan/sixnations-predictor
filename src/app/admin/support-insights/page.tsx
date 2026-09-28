"use client";

import { useEffect, useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import { formatIrishDate } from "@/lib/formatIrishDate";

type Interaction = {
  id: string;
  question: string;
  createdAt: string;
  matchedTopic: string | null;
  needsChoice: boolean;
  optionIds: string[];
  selectedTopic?: string;
  helpful?: boolean;
};

type Suggestion = {
  key: string;
  phrase: string;
  topicId: string;
  count: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  lastSeenAt: string;
};

type Insights = {
  success: boolean;
  error?: string;
  summary: {
    totalStored: number;
    ambiguous: number;
    helpful: number;
    notHelpful: number;
    pendingSuggestions: number;
    approvedMappings: number;
  };
  recentInteractions: Interaction[];
  suggestions: Suggestion[];
};

async function fetchInsights() {
  const response = await fetch("/api/admin/support-insights", {
    credentials: "include",
    cache: "no-store",
  });
  const result = (await response.json()) as Insights;
  if (!response.ok) {
    const error = new Error(result.error ?? "Unable to load support insights.");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return result;
}

export default function SupportInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await fetchInsights());
    } catch (loadError) {
      const typed = loadError as Error & { status?: number };
      if (typed.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (typed.status === 403) {
        window.location.href = "/dashboard";
        return;
      }
      setError(typed.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(key: string, status: "APPROVED" | "REJECTED") {
    setUpdatingKey(key);
    setError("");
    try {
      const response = await fetch("/api/admin/support-insights", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update mapping.");
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to update mapping.");
    } finally {
      setUpdatingKey("");
    }
  }

  const suggestions = [...(data?.suggestions ?? [])].sort((a, b) => {
    const order = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
    return order[a.status] - order[b.status] || b.count - a.count;
  });

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader
          title="Support Insights"
          subtitle="Review chatbot questions, feedback and proposed intent mappings before they can influence future answers"
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { window.location.href = "/admin/dashboard"; }}>
            Back to Admin Dashboard
          </Button>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {error ? (
          <p className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard title="Stored Questions" value={data?.summary.totalStored ?? 0} tone="navy" />
          <StatCard title="Ambiguous" value={data?.summary.ambiguous ?? 0} tone="blue" />
          <StatCard title="Helpful" value={data?.summary.helpful ?? 0} tone="lime" />
          <StatCard title="Not Helpful" value={data?.summary.notHelpful ?? 0} tone="orange" />
          <StatCard title="Pending Mappings" value={data?.summary.pendingSuggestions ?? 0} tone="blue" />
          <StatCard title="Approved Mappings" value={data?.summary.approvedMappings ?? 0} tone="lime" />
        </div>

        <Card title="Proposed Intent Mappings" className="mb-6">
          <p className="mb-4 text-sm text-[var(--brand-muted)]">
            A proposal is created when a user chooses one of the chatbot&apos;s likely answers.
            Nothing here changes Perfect XV rules or approved help content. Only approved mappings
            are used to improve future question interpretation.
          </p>

          {loading && !data ? <p>Loading support insights...</p> : null}
          {!loading && suggestions.length === 0 ? <p>No intent mappings have been proposed yet.</p> : null}

          <div className="space-y-3">
            {suggestions.map((item) => (
              <section key={item.key} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">&ldquo;{item.phrase}&rdquo;</p>
                    <p className="mt-1 text-sm text-[var(--brand-muted)]">
                      Proposed topic: <strong>{item.topicId}</strong> · selected {item.count} time{item.count === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--brand-muted)]">
                      Last seen {formatIrishDate(item.lastSeenAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    disabled={updatingKey === item.key || item.status === "APPROVED"}
                    onClick={() => void review(item.key, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={updatingKey === item.key || item.status === "REJECTED"}
                    onClick={() => void review(item.key, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              </section>
            ))}
          </div>
        </Card>

        <Card title="Recent Support Questions">
          <p className="mb-4 text-sm text-[var(--brand-muted)]">
            Questions are retained without a user ID or IP address. Obvious email addresses,
            long payment-card-like numbers and password/CVV values are redacted before storage.
          </p>

          {!loading && (data?.recentInteractions.length ?? 0) === 0 ? (
            <p>No support interactions have been recorded yet.</p>
          ) : null}

          <div className="space-y-3">
            {(data?.recentInteractions ?? []).map((item) => (
              <section key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold">{item.question}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--brand-muted)]">
                  <span>Interpreted: {item.matchedTopic ?? (item.needsChoice ? "Choice required" : "No match")}</span>
                  <span>Selected: {item.selectedTopic ?? "—"}</span>
                  <span>
                    Helpful: {item.helpful === true ? "Yes" : item.helpful === false ? "No" : "Not rated"}
                  </span>
                  <span>{formatIrishDate(item.createdAt)}</span>
                </div>
              </section>
            ))}
          </div>
        </Card>
      </PageContainer>
    </main>
  );
}
