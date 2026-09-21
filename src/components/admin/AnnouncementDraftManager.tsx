"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Audience = "ALL_VERIFIED" | "CURRENT_ENTRANTS" | "NO_CURRENT_ENTRY";

type Campaign = {
  id: number;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
  audience: Audience;
  updatedAt: string;
  _count: { testDeliveries: number };
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL_VERIFIED: "All verified users",
  CURRENT_ENTRANTS: "Current competition entrants",
  NO_CURRENT_ENTRY: "Verified users without a current annual entry",
};

const EMPTY_FORM = {
  subject: "",
  heading: "",
  message: "",
  actionLabel: "",
  actionUrl: "",
  audience: "ALL_VERIFIED" as Audience,
};

export default function AnnouncementDraftManager() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<Record<Audience, number>>({
    ALL_VERIFIED: 0,
    CURRENT_ENTRANTS: 0,
    NO_CURRENT_ENTRY: 0,
  });
  const [savedCampaignId, setSavedCampaignId] = useState<number | null>(null);
  const [draftIsSaved, setDraftIsSaved] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { void loadDrafts(); }, []);

  async function loadDrafts() {
    const response = await fetch("/api/admin/announcements", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to load announcement drafts.");
      return;
    }
    setCampaigns(data.campaigns ?? []);
    setAudienceCounts(data.audienceCounts ?? {});
  }

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setDraftIsSaved(false);
    setPreviewHtml("");
    setMessage("");
  }

  function payload() {
    return {
      ...form,
      actionLabel: form.actionLabel || null,
      actionUrl: form.actionUrl || null,
    };
  }

  async function saveDraft() {
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload(), campaignId: savedCampaignId }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save the draft.");
      return;
    }
    setSavedCampaignId(data.campaign.id);
    setDraftIsSaved(true);
    setMessage("Announcement saved safely as a draft. Nothing was sent.");
    await loadDrafts();
  }

  async function previewDraft() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/announcements/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to preview the announcement.");
      return;
    }
    setPreviewHtml(data.html);
  }

  async function sendTest() {
    if (!savedCampaignId || !draftIsSaved) {
      setError("Save the current draft before sending a test.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/announcements/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: savedCampaignId }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to send the test email.");
      return;
    }
    setMessage(`Test email sent to ${data.recipientEmail}. No users were contacted.`);
    await loadDrafts();
  }

  function loadCampaign(campaign: Campaign) {
    setForm({
      subject: campaign.subject,
      heading: campaign.heading,
      message: campaign.message,
      actionLabel: campaign.actionLabel ?? "",
      actionUrl: campaign.actionUrl ?? "",
      audience: campaign.audience,
    });
    setSavedCampaignId(campaign.id);
    setDraftIsSaved(true);
    setPreviewHtml("");
    setError("");
    setMessage(`Loaded draft #${campaign.id}.`);
  }

  function newDraft() {
    setForm(EMPTY_FORM);
    setSavedCampaignId(null);
    setDraftIsSaved(false);
    setPreviewHtml("");
    setError("");
    setMessage("New unsaved draft started.");
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card title="Optional Announcement Draft">
        <div className="space-y-4">
          {message ? <Alert variant="success">{message}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            Bulk sending is deliberately disabled. This section currently supports drafts, previews and administrator test emails only.
          </div>
          <label className="block text-sm font-semibold">Audience
            <select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" value={form.audience} onChange={(event) => updateField("audience", event.target.value)}>
              {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((audience) => (
                <option key={audience} value={audience}>
                  {AUDIENCE_LABELS[audience]} ({audienceCounts[audience] ?? 0})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">Email subject
            <Input className="mt-1" maxLength={160} value={form.subject} onChange={(event) => updateField("subject", event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Heading
            <Input className="mt-1" maxLength={160} value={form.heading} onChange={(event) => updateField("heading", event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Message
            <textarea className="mt-1 min-h-40 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" maxLength={5000} value={form.message} onChange={(event) => updateField("message", event.target.value)} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">Optional button label
              <Input className="mt-1" maxLength={80} value={form.actionLabel} onChange={(event) => updateField("actionLabel", event.target.value)} />
            </label>
            <label className="block text-sm font-semibold">Optional button link
              <Input className="mt-1" type="url" maxLength={500} value={form.actionUrl} onChange={(event) => updateField("actionUrl", event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void previewDraft()}>Preview</Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void saveDraft()}>Save Draft</Button>
            <Button type="button" disabled={busy || !savedCampaignId || !draftIsSaved} onClick={() => void sendTest()}>Send Test to Me</Button>
          </div>
          {previewHtml ? (
            <iframe className="h-[560px] w-full rounded-lg border border-[var(--brand-border)]" sandbox="" srcDoc={previewHtml} title="Announcement email preview" />
          ) : null}
        </div>
      </Card>

      <Card title="Saved Announcement Drafts">
        <div className="space-y-3">
          <Button fullWidth type="button" variant="secondary" onClick={newDraft}>Start New Draft</Button>
          {campaigns.length === 0 ? <p className="text-sm text-[var(--brand-muted)]">No announcement drafts have been saved.</p> : null}
          {campaigns.map((campaign) => (
            <button key={campaign.id} type="button" className="w-full rounded-lg border border-[var(--brand-border)] p-4 text-left hover:bg-slate-50" onClick={() => loadCampaign(campaign)}>
              <span className="block font-bold">{campaign.subject}</span>
              <span className="mt-1 block text-sm text-[var(--brand-muted)]">
                {AUDIENCE_LABELS[campaign.audience]} · {campaign._count.testDeliveries} test sends
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
