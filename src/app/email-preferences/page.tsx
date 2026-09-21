"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default function EmailPreferencesPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPreference() {
      const response = await fetch("/api/email-preferences", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to load email preferences.");
        return;
      }
      setEnabled(data.announcementEmailsEnabled);
    }
    void loadPreference();
  }, []);

  async function savePreference(nextEnabled: boolean) {
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/email-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementEmailsEnabled: nextEnabled }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save email preferences.");
      return;
    }
    setEnabled(data.announcementEmailsEnabled);
    setMessage(nextEnabled ? "Optional announcements are enabled." : "You have opted out of optional announcements.");
  }

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader title="Email Preferences" subtitle="Control optional Perfect XV announcement emails" />
        <div className="mx-auto max-w-2xl">
          <Card title="Optional Announcements">
            <div className="space-y-4">
              {message ? <Alert variant="success">{message}</Alert> : null}
              {error ? <Alert variant="error">{error}</Alert> : null}
              <p>Upcoming tournament announcements and occasional useful Perfect XV information.</p>
              <p className="text-sm text-[var(--brand-muted)]">Account-security and essential service emails are not controlled by this preference.</p>
              {enabled === null ? <p>Loading preference...</p> : (
                <Button fullWidth disabled={busy} variant={enabled ? "secondary" : "primary"} onClick={() => void savePreference(!enabled)}>
                  {busy ? "Saving..." : enabled ? "Opt Out of Optional Announcements" : "Opt Back In"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
