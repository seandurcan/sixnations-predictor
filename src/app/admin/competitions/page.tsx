"use client";

import { FormEvent, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

type Competition = {
  id: number;
  year: number;
  name: string;
  status: string;
  entryFee: string;
  currency: string;
  firstKickoff: string | null;
  predictionLockAt: string | null;
  _count: { matches: number; entries: number };
};

type Team = { id: number; name: string; shortCode: string };

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);
  const [teamSetComplete, setTeamSetComplete] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear() + 1));
  const [name, setName] = useState(`${new Date().getFullYear() + 1} Six Nations Championship`);
  const [entryFee, setEntryFee] = useState("20.00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { void loadCompetitions(); }, []);

  async function loadCompetitions() {
    setLoading(true);
    const response = await fetch("/api/admin/competitions", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      window.location.href = "/login";
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to load competitions.");
    } else {
      setCompetitions(data.competitions);
      setTeams(data.permanentTeams);
      setTeamSetComplete(data.permanentTeamSetComplete);
      setCurrentTournamentId(data.currentTournamentId);
    }
    setLoading(false);
  }

  async function createCompetition(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const response = await fetch("/api/admin/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, name, entryFee }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to create the competition.");
      return;
    }
    setSuccess(`${data.competition.name} was created safely as a draft. No fixtures or entrants were copied.`);
    await loadCompetitions();
  }

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader title="Competition Manager" subtitle="Prepare future annual championships without changing the current competition" />

        {error && <div className="mb-5"><Alert variant="error">{error}</Alert></div>}
        {success && <div className="mb-5"><Alert variant="success">{success}</Alert></div>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card title="Competitions">
            {loading ? <p>Loading competitions...</p> : (
              <div className="space-y-3">
                {competitions.map((competition) => (
                  <div key={competition.id} className="rounded-lg border border-[var(--brand-border)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{competition.name}</h3>
                          <StatusBadge status={competition.status} />
                          {competition.id === currentTournamentId && (
                            <span className="rounded-full bg-lime-100 px-2 py-1 text-xs font-bold text-lime-900">CURRENT</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-[var(--brand-muted)]">
                          {competition._count.matches} fixtures · {competition._count.entries} annual entries · {competition.currency} {Number(competition.entryFee).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card title="Create Annual Competition">
              <form className="space-y-4" onSubmit={createCompetition}>
                <label className="block text-sm font-semibold">Year<Input className="mt-1" type="number" min="1883" max="2200" value={year} onChange={(event) => setYear(event.target.value)} required /></label>
                <label className="block text-sm font-semibold">Competition name<Input className="mt-1" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required /></label>
                <label className="block text-sm font-semibold">Entry fee (€)<Input className="mt-1" type="number" min="0" max="10000" step="0.01" value={entryFee} onChange={(event) => setEntryFee(event.target.value)} required /></label>
                <Button fullWidth disabled={saving || !teamSetComplete} type="submit">{saving ? "Creating..." : "Create Safe Draft"}</Button>
              </form>
              <p className="mt-4 text-sm text-[var(--brand-muted)]">This creates no fixtures, results, predictions, payments or copied entrants. Existing accounts remain unchanged.</p>
            </Card>

            <Card title="Permanent Participant Teams">
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => <span key={team.id} className="rounded-full border border-[var(--brand-border)] px-3 py-1 text-sm font-semibold">{team.name} ({team.shortCode})</span>)}
              </div>
              {!teamSetComplete && <p className="mt-3 text-sm font-semibold text-red-700">The six-team master set is incomplete. Draft creation is disabled.</p>}
            </Card>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
