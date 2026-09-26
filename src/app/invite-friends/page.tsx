"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type InviteRow = {
  firstName: string;
  lastName: string;
  email: string;
};

type InviteResult = {
  email: string;
  status:
    | "SENT"
    | "ALREADY_INVITED"
    | "REGISTERED"
    | "UNSUBSCRIBED"
    | "DUPLICATE_IN_REQUEST"
    | "LIMIT_REACHED"
    | "FAILED";
};

const emptyRow = (): InviteRow => ({
  firstName: "",
  lastName: "",
  email: "",
});

function statusText(status: InviteResult["status"]) {
  switch (status) {
    case "SENT":
      return "Invitation sent";
    case "ALREADY_INVITED":
      return "Already invited — no duplicate email sent";
    case "REGISTERED":
      return "Already registered — no invitation sent";
    case "UNSUBSCRIBED":
      return "Has unsubscribed — no invitation sent";
    case "DUPLICATE_IN_REQUEST":
      return "Duplicate in this list — no duplicate email sent";
    case "LIMIT_REACHED":
      return "Daily invitation limit reached";
    default:
      return "Invitation could not be sent";
  }
}

export default function InviteFriendsPage() {
  const [rows, setRows] = useState<InviteRow[]>([emptyRow()]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<InviteResult[]>([]);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          window.location.href = "/login?returnTo=/invite-friends";
          return;
        }
        setLoadingAuth(false);
      })
      .catch(() => {
        window.location.href = "/login?returnTo=/invite-friends";
      });
  }, []);

  const canAddMore = rows.length < 10;
  const canSend = useMemo(
    () =>
      rows.length > 0 &&
      rows.every(
        (row) =>
          row.firstName.trim() &&
          row.lastName.trim() &&
          row.email.trim()
      ),
    [rows]
  );

  function updateRow(index: number, field: keyof InviteRow, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  function addRow() {
    if (!canAddMore) return;
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((current) =>
      current.length === 1
        ? [emptyRow()]
        : current.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  async function sendInvitations() {
    setSending(true);
    setError("");
    setMessage("");
    setResults([]);

    const response = await fetch("/api/invite-friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ people: rows }),
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to send invitations.");
      return;
    }

    setResults(Array.isArray(data.results) ? data.results : []);
    setMessage(
      data.sent > 0
        ? `${data.sent} invitation${data.sent === 1 ? "" : "s"} sent.`
        : "No new invitations were sent."
    );
  }

  async function sharePerfectXv() {
    const shareData = {
      title: "Perfect XV",
      text: "Have a look at Perfect XV — rugby score predictions across different competitions.",
      url: "https://perfect-xv.org",
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage("Share options opened.");
        return;
      }

      await navigator.clipboard.writeText("https://perfect-xv.org");
      setShareMessage("Perfect XV link copied.");
    } catch (shareError) {
      if ((shareError as Error)?.name !== "AbortError") {
        setShareMessage("Unable to open sharing. You can use https://perfect-xv.org");
      }
    }
  }

  if (loadingAuth) {
    return (
      <main className="bg-white text-[var(--brand-navy)]">
        <PageContainer>
          <Card>Loading invitation page...</Card>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Invite Friends to Perfect XV"
          subtitle="Invite friends, teammates or anyone who might enjoy rugby predictions."
        />

        <div className="space-y-6">
          <Card title="Send Invitations">
            <div className="space-y-5">
              <p className="text-[var(--brand-muted)]">
                Invitations are to Perfect XV generally. Recipients register themselves and can then choose which competitions they wish to enter.
              </p>

              {message ? <Alert variant="success">{message}</Alert> : null}
              {error ? <Alert variant="error">{error}</Alert> : null}

              <div className="space-y-4">
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-[var(--brand-border)] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Person {index + 1}</h3>
                      {rows.length > 1 ? (
                        <Button variant="secondary" onClick={() => removeRow(index)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        placeholder="First Name"
                        value={row.firstName}
                        onChange={(event) => updateRow(index, "firstName", event.target.value)}
                      />
                      <Input
                        placeholder="Surname"
                        value={row.lastName}
                        onChange={(event) => updateRow(index, "lastName", event.target.value)}
                      />
                      <Input
                        type="email"
                        placeholder="Email Address"
                        value={row.email}
                        onChange={(event) => updateRow(index, "email", event.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  disabled={!canAddMore || sending}
                  onClick={addRow}
                >
                  Add Another Person
                </Button>
                <Button
                  disabled={!canSend || sending}
                  onClick={() => void sendInvitations()}
                >
                  {sending ? "Sending Invitations..." : "Send Invitations"}
                </Button>
              </div>

              <p className="text-sm text-[var(--brand-muted)]">
                Perfect XV will not send another recruitment invitation to an address that has already been invited, has registered, or has unsubscribed.
              </p>

              {results.length > 0 ? (
                <div className="rounded-lg bg-slate-50 p-4">
                  <h3 className="font-bold">Invitation Results</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {results.map((result, index) => (
                      <div key={`${result.email}-${index}`} className="flex flex-wrap justify-between gap-2">
                        <span>{result.email}</span>
                        <span className="font-semibold">{statusText(result.status)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Invite Someone in Person">
            <div className="grid gap-6 md:grid-cols-[260px_1fr] md:items-center">
              <div className="flex justify-center">
                <img
                  src="/dynamic-qr-router/flexible-qr-code.png"
                  alt="QR code for Perfect XV"
                  className="h-60 w-60 rounded-lg border border-[var(--brand-border)] bg-white p-3"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold">Scan to visit Perfect XV</h3>
                <p className="mt-2 text-[var(--brand-muted)]">
                  Show this QR code to friends or teammates and they can open the site immediately on their phone.
                </p>

                <div className="mt-5">
                  <Button onClick={() => void sharePerfectXv()}>
                    Share Perfect XV
                  </Button>
                </div>

                {shareMessage ? (
                  <p className="mt-3 text-sm text-[var(--brand-muted)]">
                    {shareMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
