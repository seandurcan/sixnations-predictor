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

type PreviewFixture = {
  providerGameId: number | null;
  round: number | null;
  kickoffTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  providerHomeTeam: string;
  providerAwayTeam: string;
  venue: string | null;
  city: string | null;
  country: string | null;
};

type FixturePreview = {
  provider: string;
  providerLeague: { id: number; name: string };
  fixtures: PreviewFixture[];
  warnings: string[];
  valid: boolean;
  expectedFixtureCount: number;
  discoveredFixtureCount: number;
};

function formatKickoff(value: string | null) {
  if (!value) return "Kickoff time unavailable";
  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(new Date(value));
}

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
  const [discoveringId, setDiscoveringId] = useState<number | null>(null);
  const [previewCompetition, setPreviewCompetition] = useState<Competition | null>(null);
  const [fixturePreview, setFixturePreview] = useState<FixturePreview | null>(null);
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

  async function previewFixtures(competition: Competition) {
    setDiscoveringId(competition.id);
    setError("");
    setSuccess("");
    setFixturePreview(null);
    setPreviewCompetition(null);
    const response = await fetch("/api/admin/competitions/fixtures/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: competition.id }),
    });
    const data = await response.json();
    setDiscoveringId(null);
    if (!response.ok) {
      setError(data.error ?? "Unable to discover fixtures.");
      return;
    }
    setPreviewCompetition(competition);
    setFixturePreview(data.preview);
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
                      {competition.status === "DRAFT" && competition._count.matches === 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={discoveringId !== null}
                          onClick={() => void previewFixtures(competition)}
                        >
                          {discoveringId === competition.id ? "Finding..." : "Find Fixture Preview"}
                        </Button>
                      )}
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

        {fixturePreview && previewCompetition && (
          <div className="mt-6">
            <Card title={`Fixture Preview — ${previewCompetition.name}`}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {fixturePreview.discoveredFixtureCount} of {fixturePreview.expectedFixtureCount} fixtures found through {fixturePreview.provider}
                  </p>
                  <p className="text-sm text-[var(--brand-muted)]">
                    Provider competition: {fixturePreview.providerLeague.name}. This is a review only; nothing has been saved.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${fixturePreview.valid ? "bg-lime-100 text-lime-900" : "bg-amber-100 text-amber-900"}`}>
                  {fixturePreview.valid ? "VALIDATED" : "REVIEW REQUIRED"}
                </span>
              </div>

              {fixturePreview.warnings.length > 0 && (
                <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-950">Validation warnings</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                    {fixturePreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--brand-border)] text-xs uppercase text-[var(--brand-muted)]">
                    <tr>
                      <th className="px-3 py-2">No.</th>
                      <th className="px-3 py-2">Round</th>
                      <th className="px-3 py-2">Fixture</th>
                      <th className="px-3 py-2">Kickoff (Ireland)</th>
                      <th className="px-3 py-2">Stadium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixturePreview.fixtures.map((fixture, index) => (
                      <tr className="border-b border-[var(--brand-border)]" key={`${fixture.providerGameId ?? "unknown"}-${index}`}>
                        <td className="px-3 py-3 font-semibold">{index + 1}</td>
                        <td className="px-3 py-3">{fixture.round ?? "—"}</td>
                        <td className="px-3 py-3 font-semibold">
                          {fixture.homeTeam ?? fixture.providerHomeTeam} v {fixture.awayTeam ?? fixture.providerAwayTeam}
                        </td>
                        <td className="px-3 py-3">{formatKickoff(fixture.kickoffTime)}</td>
                        <td className="px-3 py-3">
                          {[fixture.venue, fixture.city, fixture.country].filter(Boolean).join(", ") || "Not supplied"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-5 text-sm font-semibold text-[var(--brand-muted)]">
                Saving and approval are deliberately disabled in this stage. The live competition and all participant data remain unchanged.
              </p>
            </Card>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
