"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function PredictionsDownload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/predictions/pdf", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(response.status === 401 ? "Please sign in again to download your predictions." : result.error);
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "perfect-xv-my-predictions.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to download your predictions. Please try again.");
    } finally { setBusy(false); }
  }
  return (
    <div className="mb-8">
      <Card title="Your predictions PDF">
        <p className="mb-4 text-sm text-[var(--brand-muted)]">Download your submitted predictions, fixture details and submission information. You can print the downloaded PDF.</p>
        <Button variant="secondary" disabled={busy} onClick={download}>
          {busy ? "Preparing PDF…" : "Download my predictions (PDF)"}
        </Button>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      </Card>
    </div>
  );
}
