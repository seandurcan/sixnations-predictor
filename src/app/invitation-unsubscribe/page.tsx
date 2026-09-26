"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default function InvitationUnsubscribePage() {
  const [token, setToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(value);

    if (!value) {
      setError("This unsubscribe link is not valid.");
      setLoading(false);
      return;
    }

    void fetch(`/api/invite-friends/unsubscribe?token=${encodeURIComponent(value)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Unable to verify this unsubscribe link.");
          return;
        }
        setFirstName(data.firstName ?? "");
        setUnsubscribed(Boolean(data.unsubscribed));
      })
      .catch(() => setError("Unable to verify this unsubscribe link."))
      .finally(() => setLoading(false));
  }, []);

  async function unsubscribe() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/invite-friends/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to update your invitation preference.");
      return;
    }

    setUnsubscribed(true);
  }

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Perfect XV Invitation Preferences"
          subtitle="Control future recruitment invitations."
        />

        <div className="mx-auto max-w-2xl">
          <Card>
            {loading ? (
              <p>Checking your invitation preference...</p>
            ) : error ? (
              <Alert variant="error">{error}</Alert>
            ) : unsubscribed ? (
              <Alert variant="success" title="Invitation emails stopped">
                {firstName ? `Thanks, ${firstName}. ` : ""}
                This email address will not receive another Perfect XV recruitment invitation.
              </Alert>
            ) : (
              <div className="space-y-4">
                <p>
                  {firstName ? `Hi ${firstName}. ` : ""}
                  If you do not want to receive another invitation to try Perfect XV, you can unsubscribe here.
                </p>
                <Button disabled={busy} onClick={() => void unsubscribe()}>
                  {busy ? "Updating..." : "Unsubscribe from Invitations"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
