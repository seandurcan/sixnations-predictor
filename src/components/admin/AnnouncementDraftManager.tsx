"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Audience = "ALL_VERIFIED" | "CURRENT_ENTRANTS" | "NO_CURRENT_ENTRY";
type CampaignStatus = "DRAFT" | "READY" | "SENDING" | "SENT" | "CANCELLED";
type DeliveryCounts = { total: number; pending: number; sending: number; sent: number; failed: number; skipped: number };
type Campaign = {
  id: number; subject: string; heading: string; message: string;
  actionLabel: string | null; actionUrl: string | null; audience: Audience;
  status: CampaignStatus; recipientCount: number; updatedAt: string;
  confirmedAt: string | null; sentAt: string | null; cancelledAt: string | null;
  deliverySummary: { test: DeliveryCounts; bulk: DeliveryCounts };
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL_VERIFIED: "All verified users",
  CURRENT_ENTRANTS: "Current competition entrants",
  NO_CURRENT_ENTRY: "Verified users without a current annual entry",
};
const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Draft", READY: "Confirmed", SENDING: "Sending", SENT: "Complete", CANCELLED: "Cancelled",
};
const EMPTY_FORM = {
  subject: "", heading: "", message: "", actionLabel: "", actionUrl: "",
  audience: "ALL_VERIFIED" as Audience,
};

export default function AnnouncementDraftManager() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<Record<Audience, number>>({ ALL_VERIFIED: 0, CURRENT_ENTRANTS: 0, NO_CURRENT_ENTRY: 0 });
  const [batchSize, setBatchSize] = useState(25);
  const [savedCampaignId, setSavedCampaignId] = useState<number | null>(null);
  const [draftIsSaved, setDraftIsSaved] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === savedCampaignId) ?? null, [campaigns, savedCampaignId]);
  const isDraft = !selectedCampaign || selectedCampaign.status === "DRAFT";

  async function loadCampaigns() {
    const response = await fetch("/api/admin/announcements", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Unable to load announcements."); return; }
    setCampaigns(data.campaigns ?? []);
    setAudienceCounts(data.audienceCounts ?? {});
    setBatchSize(data.batchSize ?? 25);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/announcements", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) {
          setError(data.error ?? "Unable to load announcements.");
          return;
        }
        setCampaigns(data.campaigns ?? []);
        setAudienceCounts(data.audienceCounts ?? {});
        setBatchSize(data.batchSize ?? 25);
      })
      .catch((loadError: unknown) => {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setError("Unable to load announcements.");
        }
      });
    return () => controller.abort();
  }, []);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    if (!isDraft) return;
    setForm((current) => ({ ...current, [field]: value }));
    setDraftIsSaved(false); setPreviewHtml(""); setMessage("");
  }
  function payload() {
    return { ...form, actionLabel: form.actionLabel || null, actionUrl: form.actionUrl || null };
  }

  async function saveDraft() {
    if (!isDraft) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload(), campaignId: savedCampaignId }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Unable to save the draft."); return; }
      setSavedCampaignId(data.campaign.id); setDraftIsSaved(true);
      setMessage("Announcement saved safely as a draft. Nothing was sent.");
      await loadCampaigns();
    } finally { setBusy(false); }
  }

  async function previewDraft() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/announcements/preview", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Unable to preview the announcement."); return; }
      setPreviewHtml(data.html);
    } finally { setBusy(false); }
  }

  async function sendTest() {
    if (!savedCampaignId || !draftIsSaved || !isDraft) { setError("Save the current draft before sending a test."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/announcements/test", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: savedCampaignId }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Unable to send the test email."); return; }
      setMessage(`Test email sent to ${data.recipientEmail}. No users were contacted.`);
      await loadCampaigns();
    } finally { setBusy(false); }
  }

  async function runDeliveryAction(action: "confirm" | "send_next" | "retry_failed" | "cancel") {
    if (!selectedCampaign) return;
    const count = audienceCounts[selectedCampaign.audience] ?? 0;
    const prompts = {
      confirm: `Lock this announcement and its ${count} eligible recipients? This does not send any email.`,
      send_next: `Send the next batch of up to ${batchSize} emails? Only this one batch will be attempted.`,
      retry_failed: "Return failed emails to the queue? They will not send until you choose Send Next Batch.",
      cancel: "Cancel every remaining unsent email? Emails already accepted by the provider cannot be recalled.",
    };
    if (!window.confirm(prompts[action])) return;
    const confirmations = { confirm: "CONFIRM", send_next: "SEND", retry_failed: "RETRY", cancel: "CANCEL" };
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/announcements/delivery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: selectedCampaign.id, action, confirmation: confirmations[action], expectedRecipientCount: action === "confirm" ? count : undefined }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Unable to update announcement delivery."); return; }
      const messages = {
        confirm: "Recipients confirmed. Nothing was sent; use Send Next Batch when ready.",
        send_next: "Batch processed. Refreshing the accepted, failed and remaining totals.",
        retry_failed: "Failed emails returned to the queue. Nothing was sent.",
        cancel: "Remaining unsent emails cancelled.",
      };
      setMessage(messages[action]);
      await loadCampaigns();
    } finally { setBusy(false); }
  }

  function loadCampaign(campaign: Campaign) {
    setForm({ subject: campaign.subject, heading: campaign.heading, message: campaign.message, actionLabel: campaign.actionLabel ?? "", actionUrl: campaign.actionUrl ?? "", audience: campaign.audience });
    setSavedCampaignId(campaign.id); setDraftIsSaved(true); setPreviewHtml(""); setError("");
    setMessage(`Loaded announcement #${campaign.id}.`);
  }
  function newDraft() {
    setForm(EMPTY_FORM); setSavedCampaignId(null); setDraftIsSaved(false); setPreviewHtml(""); setError(""); setMessage("New unsaved draft started.");
  }

  const bulk = selectedCampaign?.deliverySummary.bulk;
  const successfulTests = selectedCampaign?.deliverySummary.test.sent ?? 0;
  const canConfirm = Boolean(selectedCampaign?.status === "DRAFT" && draftIsSaved && successfulTests > 0);
  const canSend = Boolean(selectedCampaign && ["READY", "SENDING"].includes(selectedCampaign.status) && (bulk?.pending ?? 0) > 0 && (bulk?.sending ?? 0) === 0);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card title="Optional Announcements"><div className="space-y-4">
        {message ? <Alert variant="success">{message}</Alert> : null}
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Announcements use a controlled sequence: save, preview, send a test, confirm recipients, then send one batch at a time. No batch sends automatically.</div>
        {!isDraft ? <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">Content and audience are locked after recipients are confirmed.</div> : null}
        <label className="block text-sm font-semibold">Audience
          <select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 disabled:bg-slate-100" value={form.audience} disabled={!isDraft || busy} onChange={(event) => updateField("audience", event.target.value)}>
            {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((audience) => <option key={audience} value={audience}>{AUDIENCE_LABELS[audience]} ({audienceCounts[audience] ?? 0})</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Email subject<Input className="mt-1" maxLength={160} value={form.subject} disabled={!isDraft || busy} onChange={(event) => updateField("subject", event.target.value)} /></label>
        <label className="block text-sm font-semibold">Heading<Input className="mt-1" maxLength={160} value={form.heading} disabled={!isDraft || busy} onChange={(event) => updateField("heading", event.target.value)} /></label>
        <label className="block text-sm font-semibold">Message<textarea className="mt-1 min-h-40 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 disabled:bg-slate-100" maxLength={5000} value={form.message} disabled={!isDraft || busy} onChange={(event) => updateField("message", event.target.value)} /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold">Optional button label<Input className="mt-1" maxLength={80} value={form.actionLabel} disabled={!isDraft || busy} onChange={(event) => updateField("actionLabel", event.target.value)} /></label>
          <label className="block text-sm font-semibold">Optional button link<Input className="mt-1" type="url" maxLength={500} value={form.actionUrl} disabled={!isDraft || busy} onChange={(event) => updateField("actionUrl", event.target.value)} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void previewDraft()}>Preview</Button>
          <Button type="button" variant="secondary" disabled={busy || !isDraft} onClick={() => void saveDraft()}>Save Draft</Button>
          <Button type="button" disabled={busy || !savedCampaignId || !draftIsSaved || !isDraft} onClick={() => void sendTest()}>Send Test to Me</Button>
        </div>
        {previewHtml ? <iframe className="h-[560px] w-full rounded-lg border border-[var(--brand-border)]" sandbox="" srcDoc={previewHtml} title="Announcement email preview" /> : null}

        {selectedCampaign ? <div className="space-y-4 rounded-lg border border-[var(--brand-border)] p-4">
          <div><h3 className="font-bold">Controlled delivery</h3><p className="text-sm text-[var(--brand-muted)]">Status: {STATUS_LABELS[selectedCampaign.status]} · Successful tests: {successfulTests}</p></div>
          {selectedCampaign.status === "DRAFT" ? <>
            <p className="text-sm">Current eligible audience: <strong>{audienceCounts[selectedCampaign.audience] ?? 0}</strong>. Confirmation freezes this exact recipient list and locks the content. It does not send email.</p>
            <Button fullWidth type="button" disabled={busy || !canConfirm} onClick={() => void runDeliveryAction("confirm")}>Confirm {audienceCounts[selectedCampaign.audience] ?? 0} Recipients</Button>
            {!successfulTests ? <p className="text-sm text-amber-800">A successful administrator test is required before confirmation.</p> : null}
          </> : <>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-[var(--brand-muted)]">Frozen recipients</dt><dd className="font-bold">{selectedCampaign.recipientCount}</dd></div>
              <div><dt className="text-[var(--brand-muted)]">Accepted</dt><dd className="font-bold">{bulk?.sent ?? 0}</dd></div>
              <div><dt className="text-[var(--brand-muted)]">Remaining</dt><dd className="font-bold">{(bulk?.pending ?? 0) + (bulk?.sending ?? 0)}</dd></div>
              <div><dt className="text-[var(--brand-muted)]">Failed</dt><dd className="font-bold">{bulk?.failed ?? 0}</dd></div>
              <div><dt className="text-[var(--brand-muted)]">Skipped</dt><dd className="font-bold">{bulk?.skipped ?? 0}</dd></div>
            </dl>
            <p className="text-xs text-[var(--brand-muted)]">“Accepted” means accepted by the email provider; it does not guarantee inbox delivery.</p>
            {selectedCampaign.status === "SENT" ? <Alert variant="success">All eligible emails were accepted or safely skipped.</Alert> : null}
            {selectedCampaign.status === "CANCELLED" ? <Alert variant="error">Remaining unsent emails were cancelled.</Alert> : null}
            {["READY", "SENDING"].includes(selectedCampaign.status) ? <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" disabled={busy || !canSend} onClick={() => void runDeliveryAction("send_next")}>Send Next Batch (up to {batchSize})</Button>
              <Button type="button" variant="secondary" disabled={busy || (bulk?.sending ?? 0) > 0} onClick={() => void runDeliveryAction("cancel")}>Cancel Remaining</Button>
              {(bulk?.failed ?? 0) > 0 ? <Button type="button" variant="secondary" disabled={busy || (bulk?.pending ?? 0) > 0 || (bulk?.sending ?? 0) > 0} onClick={() => void runDeliveryAction("retry_failed")}>Queue {bulk?.failed} Failed for Retry</Button> : null}
            </div> : null}
          </>}
        </div> : null}
      </div></Card>

      <Card title="Saved Announcements"><div className="space-y-3">
        <Button fullWidth type="button" variant="secondary" disabled={busy} onClick={newDraft}>Start New Draft</Button>
        {campaigns.length === 0 ? <p className="text-sm text-[var(--brand-muted)]">No announcements have been saved.</p> : null}
        {campaigns.map((campaign) => <button key={campaign.id} type="button" className={`w-full rounded-lg border p-4 text-left hover:bg-slate-50 ${campaign.id === savedCampaignId ? "border-[var(--brand-blue)] bg-blue-50" : "border-[var(--brand-border)]"}`} onClick={() => loadCampaign(campaign)}>
          <span className="block font-bold">{campaign.subject}</span>
          <span className="mt-1 block text-sm text-[var(--brand-muted)]">{STATUS_LABELS[campaign.status]} · {AUDIENCE_LABELS[campaign.audience]} · {campaign.deliverySummary.test.sent} successful tests</span>
          {campaign.status !== "DRAFT" ? <span className="mt-1 block text-sm text-[var(--brand-muted)]">{campaign.deliverySummary.bulk.sent} accepted · {campaign.deliverySummary.bulk.pending} pending · {campaign.deliverySummary.bulk.failed} failed</span> : null}
        </button>)}
      </div></Card>
    </div>
  );
}
