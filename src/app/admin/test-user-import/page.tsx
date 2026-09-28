"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default function TestUserImportPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function selectFile(file: File | null) {
    setError("");
    setResult(null);
    setUsers([]);
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array.");
      setUsers(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read file.");
    }
  }

  async function submitImport() {
    if (!users.length) return;
    if (!window.confirm(`Import ${users.length} user records into the test site?`)) return;

    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/test-user-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ users }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Test User Import"
          subtitle="Controlled one-time user migration"
          className="mb-6"
        />

        {error ? <Alert variant="error" title="Error" className="mb-6">{error}</Alert> : null}

        {result ? (
          <Alert variant={result.success ? "success" : "warning"} title="Import Result" className="mb-6">
            <p>Supplied: {result.supplied}</p>
            <p>Created: {result.created}</p>
            <p>Updated: {result.updated}</p>
            <p>Emails sent: {result.sent}</p>
            <p>Already emailed: {result.skippedAlreadyEmailed}</p>
            <p>Email failures: {result.failedEmails}</p>
            <p>Active users: {result.totalActive}</p>
          </Alert>
        ) : null}

        <Card title="Production User Export">
          <div className="space-y-4">
            <input
              type="file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(event) => void selectFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-slate-300 p-3"
            />
            <p className="text-sm text-slate-600">Records loaded: {users.length}</p>
            <Button fullWidth disabled={busy || !users.length} onClick={() => void submitImport()}>
              {busy ? "Importing..." : "Run User Migration"}
            </Button>
          </div>
        </Card>
      </PageContainer>
    </main>
  );
}
