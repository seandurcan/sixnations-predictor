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

type HelpdeskTicket = {
  id: string;
  requesterEmail: string;
  question: string;
  chatbotAnswer: string;
  createdAt: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  emailStatus: string;
  whatsappStatus: string;
  emailError?: string;
  whatsappError?: string;
  adminReply?: string;
  repliedAt?: string;
  learningPublished?: boolean;
  learningTopicId?: string;
};

type TopicOption = {
  id: string;
  label: string;
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
    openTickets: number;
    publishedClarifications: number;
  };
  recentInteractions: Interaction[];
  suggestions: Suggestion[];
  tickets: HelpdeskTicket[];
  topicOptions: TopicOption[];
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
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [topics, setTopics] = useState<Record<string, string>>({});
  const [publish, setPublish] = useState<Record<string, boolean>>({});

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

  async function patch(body: Record<string, unknown>, key: string) {
    setUpdatingKey(key);
    setError("");
    try {
      const response = await fetch("/api/admin/support-insights", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update support helpdesk.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update support helpdesk.");
    } finally {
      setUpdatingKey("");
    }
  }

  function review(key: string, status: "APPROVED" | "REJECTED") {
    void patch({ action: "review-mapping", key, status }, key);
  }

  function replyTicket(ticket: HelpdeskTicket) {
    const reply = replies[ticket.id]?.trim() ?? "";
    const publishToChatbot = publish[ticket.id] === true;
    const topicId = topics[ticket.id] ?? "";

    if (!reply) {
      setError("Enter a helpdesk reply before sending.");
      return;
    }
    if (publishToChatbot && !topicId) {
      setError("Choose a chatbot topic before publishing the clarified answer.");
      return;
    }

    void patch(
      {
        action: "reply-ticket",
        ticketId: ticket.id,
        reply,
        publishToChatbot,
        topicId,
      },
      ticket.id
    );
  }

  const suggestions = [...(data?.suggestions ?? [])].sort((a, b) => {
    const order = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
    return order[a.status] - order[b.status] || b.count - a.count;
  });

  const tickets = [...(data?.tickets ?? [])].sort((a, b) => {
    const order = { OPEN: 0, ANSWERED: 1, CLOSED: 2 };
    return order[a.status] - order[b.status] ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader
          title="Support Insights & Helpdesk"
          subtitle="Review chatbot learning, answer escalated questions and approve clarified answers"
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

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Open Helpdesk" value={data?.summary.openTickets ?? 0} tone="orange" />
          <StatCard title="Not Helpful" value={data?.summary.notHelpful ?? 0} tone="orange" />
          <StatCard title="Pending Mappings" value={data?.summary.pendingSuggestions ?? 0} tone="blue" />
          <StatCard title="Published Clarifications" value={data?.summary.publishedClarifications ?? 0} tone="lime" />
        </div>

        <Card title="Helpdesk Questions" className="mb-6">
          <p className="mb-4 text-sm text-[var(--brand-muted)]">
            Questions escalated after a user marks a chatbot answer as not helpful appear here.
            Replying emails the user. When the reply provides a reusable clarification, select the
            correct topic and publish it to the chatbot at the same time.
          </p>

          {loading && !data ? <p>Loading helpdesk...</p> : null}
          {!loading && tickets.length === 0 ? <p>No helpdesk questions have been submitted.</p> : null}

          <div className="space-y-5">
            {tickets.map((ticket) => (
              <section key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ticket {ticket.id}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatIrishDate(ticket.createdAt)} · Reply to {ticket.requesterEmail}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold">
                    {ticket.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">User question</p>
                    <p className="mt-2 whitespace-pre-wrap font-semibold">{ticket.question}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Chatbot answer rejected by user</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{ticket.chatbotAnswer}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <DeliveryBadge label="Helpdesk email" status={ticket.emailStatus} />
                  <DeliveryBadge label="WhatsApp alert" status={ticket.whatsappStatus} />
                  {ticket.learningPublished ? (
                    <span className="rounded-full border border-lime-300 bg-lime-50 px-3 py-1 font-semibold">
                      Chatbot clarification published
                    </span>
                  ) : null}
                </div>

                {ticket.emailError ? (
                  <p className="mt-2 text-xs font-semibold text-red-700">Email: {ticket.emailError}</p>
                ) : null}
                {ticket.whatsappError ? (
                  <p className="mt-2 text-xs font-semibold text-orange-700">WhatsApp: {ticket.whatsappError}</p>
                ) : null}

                {ticket.adminReply ? (
                  <div className="mt-4 rounded-lg border border-lime-200 bg-lime-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Helpdesk reply sent</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{ticket.adminReply}</p>
                    {ticket.repliedAt ? (
                      <p className="mt-2 text-xs text-slate-500">{formatIrishDate(ticket.repliedAt)}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm font-semibold">
                      Helpdesk reply
                      <textarea
                        value={replies[ticket.id] ?? ""}
                        onChange={(event) =>
                          setReplies((current) => ({ ...current, [ticket.id]: event.target.value }))
                        }
                        rows={5}
                        maxLength={1800}
                        placeholder="Write the answer that will be emailed to the user."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={publish[ticket.id] === true}
                        onChange={(event) =>
                          setPublish((current) => ({ ...current, [ticket.id]: event.target.checked }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <strong>Use this clarified reply to improve the chatbot.</strong>
                        <span className="block text-[var(--brand-muted)]">
                          This creates an administrator-approved answer for future similar questions.
                        </span>
                      </span>
                    </label>

                    {publish[ticket.id] ? (
                      <label className="block text-sm font-semibold">
                        Approved chatbot topic
                        <select
                          value={topics[ticket.id] ?? ""}
                          onChange={(event) =>
                            setTopics((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option value="">Choose topic</option>
                          {(data?.topicOptions ?? []).map((topic) => (
                            <option key={topic.id} value={topic.id}>
                              {topic.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <Button
                      disabled={updatingKey === ticket.id}
                      onClick={() => replyTicket(ticket)}
                    >
                      {updatingKey === ticket.id ? "Sending..." : "Send Helpdesk Reply"}
                    </Button>
                  </div>
                )}

                {ticket.status !== "CLOSED" ? (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <Button
                      variant="secondary"
                      disabled={updatingKey === ticket.id}
                      onClick={() =>
                        void patch(
                          { action: "close-ticket", ticketId: ticket.id },
                          ticket.id
                        )
                      }
                    >
                      Close Ticket
                    </Button>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </Card>

        <Card title="Proposed Intent Mappings" className="mb-6">
          <p className="mb-4 text-sm text-[var(--brand-muted)]">
            A proposal is created when a user chooses one of the chatbot&apos;s likely answers.
            Only administrator-approved mappings are used to improve future question interpretation.
          </p>

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
                    onClick={() => review(item.key, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={updatingKey === item.key || item.status === "REJECTED"}
                    onClick={() => review(item.key, "REJECTED")}
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
            Ordinary chatbot-learning questions are retained without a user ID or IP address.
            Helpdesk tickets separately retain the reply email address supplied by the user until the
            support matter is dealt with.
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

function DeliveryBadge({ label, status }: { label: string; status: string }) {
  const ok = status === "SENT";
  const pending = status === "PENDING";
  return (
    <span
      className={[
        "rounded-full border px-3 py-1 font-semibold",
        ok
          ? "border-lime-300 bg-lime-50"
          : pending
            ? "border-blue-200 bg-blue-50"
            : "border-orange-300 bg-orange-50",
      ].join(" ")}
    >
      {label}: {status.replaceAll("_", " ")}
    </span>
  );
}
