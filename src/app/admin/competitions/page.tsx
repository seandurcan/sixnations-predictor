"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { getFollowingCompetitionYear } from "@/lib/competitionYear";

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

function dateTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

function validateEditableFixtures(fixtures: PreviewFixture[], competitionYear: number) {
  const warnings: string[] = [];
  if (fixtures.length !== 15) warnings.push(`Exactly 15 fixtures are required; currently ${fixtures.length}.`);
  fixtures.forEach((fixture, index) => {
    if (!fixture.homeTeam || !fixture.awayTeam) warnings.push(`Fixture ${index + 1} needs both teams.`);
    if (fixture.homeTeam && fixture.homeTeam === fixture.awayTeam) warnings.push(`Fixture ${index + 1} has the same team twice.`);
    const kickoff = new Date(String(fixture.kickoffTime ?? ""));
    if (Number.isNaN(kickoff.getTime())) warnings.push(`Fixture ${index + 1} needs a kickoff time.`);
    else if (kickoff.getUTCFullYear() !== competitionYear) warnings.push(`Fixture ${index + 1} kickoff must be in ${competitionYear}.`);
    if (!fixture.venue?.trim()) warnings.push(`Fixture ${index + 1} needs a stadium.`);
  });
  const complete = fixtures.filter((fixture) => fixture.homeTeam && fixture.awayTeam);
  const pairings = complete.map((fixture) => [fixture.homeTeam, fixture.awayTeam].sort().join("|"));
  if (new Set(pairings).size !== pairings.length) warnings.push("Duplicate team pairings must be corrected.");
  for (const team of ["England", "France", "Ireland", "Italy", "Scotland", "Wales"]) {
    const count = complete.filter((fixture) => fixture.homeTeam === team || fixture.awayTeam === team).length;
    if (count !== 5) warnings.push(`${team} appears in ${count} fixtures; expected 5.`);
  }
  return [...new Set(warnings)];
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);
  const [teamSetComplete, setTeamSetComplete] = useState(false);
  const [year, setYear] = useState("");
  const [name, setName] = useState("Six Nations Championship");
  const [entryFee, setEntryFee] = useState("20.00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewCompetition, setPreviewCompetition] = useState<Competition | null>(null);
  const [fixturePreview, setFixturePreview] = useState<FixturePreview | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fixtureWarnings = useMemo(
    () => previewCompetition && fixturePreview
      ? validateEditableFixtures(fixturePreview.fixtures, previewCompetition.year)
      : [],
    [fixturePreview, previewCompetition]
  );

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
      setYear(String(getFollowingCompetitionYear(
        data.competitions,
        data.currentTournamentId,
        new Date().getFullYear()
      )));
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
    setSuccess(`${formatCompetitionTitle(data.competition.name, data.competition.year)} was created safely as a draft. No fixtures or entrants were copied.`);
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

  function updateFixture(index: number, field: keyof PreviewFixture, value: string | number | null) {
    setFixturePreview((current) => current ? {
      ...current,
      fixtures: current.fixtures.map((fixture, fixtureIndex) =>
        fixtureIndex === index ? { ...fixture, [field]: value } : fixture
      ),
    } : current);
  }

  function addFixture() {
    setFixturePreview((current) => !current || current.fixtures.length >= 15 ? current : {
      ...current,
      fixtures: [...current.fixtures, {
        providerGameId: null,
        round: null,
        kickoffTime: null,
        homeTeam: null,
        awayTeam: null,
        providerHomeTeam: "",
        providerAwayTeam: "",
        venue: null,
        city: null,
        country: null,
      }],
    });
  }

  function removeFixture(index: number) {
    setFixturePreview((current) => current ? {
      ...current,
      fixtures: current.fixtures.filter((_, fixtureIndex) => fixtureIndex !== index),
    } : current);
  }

  async function approveAndImportFixtures() {
    if (!fixturePreview || !previewCompetition || fixtureWarnings.length > 0) return;
    const ordered = [...fixturePreview.fixtures].sort((a, b) =>
      String(a.kickoffTime).localeCompare(String(b.kickoffTime))
    );
    const firstKickoff = formatKickoff(ordered[0]?.kickoffTime ?? null);
    const confirmed = window.confirm(
      `Approve and import 15 fixtures for ${formatCompetitionTitle(previewCompetition.name, previewCompetition.year)}?\n\n` +
      `First kickoff: ${firstKickoff}\n` +
      "Prediction locking: one minute before first kickoff\n\n" +
      "All 15 fixtures will be saved together. The competition will remain a draft."
    );
    if (!confirmed) return;

    setImporting(true);
    setError("");
    setSuccess("");
    const response = await fetch("/api/admin/competitions/fixtures/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournamentId: previewCompetition.id,
        fixtures: fixturePreview.fixtures,
      }),
    });
    const data = await response.json();
    setImporting(false);
    if (!response.ok) {
      const details = Array.isArray(data.errors) ? ` ${data.errors.join(" ")}` : "";
      setError(`${data.error ?? "Unable to import fixtures."}${details}`);
      return;
    }
    setFixturePreview(null);
    setPreviewCompetition(null);
    setSuccess(
      `${data.imported} fixtures were approved and imported. ` +
      `The competition remains a draft and predictions lock one minute before first kickoff.`
    );
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
                          <h3 className="font-bold">{formatCompetitionTitle(competition.name, competition.year)}</h3>
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
                <p className="text-sm text-[var(--brand-muted)]">Enter the competition name without a year. The year is added automatically wherever the full title is needed.</p>
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
            <Card title={`Fixture Preview — ${formatCompetitionTitle(previewCompetition.name, previewCompetition.year)}`}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {fixturePreview.discoveredFixtureCount} of {fixturePreview.expectedFixtureCount} fixtures found through {fixturePreview.provider}
                  </p>
                  <p className="text-sm text-[var(--brand-muted)]">
                    Provider competition: {fixturePreview.providerLeague.name}. Review and correct every field before approval.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${fixtureWarnings.length === 0 ? "bg-lime-100 text-lime-900" : "bg-amber-100 text-amber-900"}`}>
                  {fixtureWarnings.length === 0 ? "READY FOR APPROVAL" : "REVIEW REQUIRED"}
                </span>
              </div>

              {fixtureWarnings.length > 0 && (
                <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-950">Validation warnings</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                    {fixtureWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                {fixturePreview.fixtures.map((fixture, index) => (
                  <div className="rounded-lg border border-[var(--brand-border)] p-4" key={`${fixture.providerGameId ?? "manual"}-${index}`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Fixture {index + 1}</h3>
                      <Button type="button" variant="secondary" onClick={() => removeFixture(index)}>Remove</Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <label className="text-sm font-semibold">Home team
                        <select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" value={fixture.homeTeam ?? ""} onChange={(event) => updateFixture(index, "homeTeam", event.target.value || null)}>
                          <option value="">Select team</option>
                          {teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-semibold">Away team
                        <select className="mt-1 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2" value={fixture.awayTeam ?? ""} onChange={(event) => updateFixture(index, "awayTeam", event.target.value || null)}>
                          <option value="">Select team</option>
                          {teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-semibold">Kickoff (Ireland)
                        <Input className="mt-1" type="datetime-local" value={dateTimeInputValue(fixture.kickoffTime)} onChange={(event) => updateFixture(index, "kickoffTime", event.target.value ? new Date(`${event.target.value}:00Z`).toISOString() : null)} />
                      </label>
                      <label className="text-sm font-semibold">Stadium
                        <Input className="mt-1" value={fixture.venue ?? ""} onChange={(event) => updateFixture(index, "venue", event.target.value)} />
                      </label>
                      <label className="text-sm font-semibold">City
                        <Input className="mt-1" value={fixture.city ?? ""} onChange={(event) => updateFixture(index, "city", event.target.value)} />
                      </label>
                      <label className="text-sm font-semibold">Country
                        <Input className="mt-1" value={fixture.country ?? ""} onChange={(event) => updateFixture(index, "country", event.target.value)} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="secondary" disabled={fixturePreview.fixtures.length >= 15} onClick={addFixture}>Add Missing Fixture</Button>
                <Button type="button" disabled={importing || fixtureWarnings.length > 0} onClick={() => void approveAndImportFixtures()}>
                  {importing ? "Importing..." : "Approve and Import 15 Fixtures"}
                </Button>
              </div>
              <p className="mt-3 text-sm text-[var(--brand-muted)]">Match numbers and five rounds are assigned automatically in kickoff order. Import is all-or-nothing and the competition remains a draft.</p>
            </Card>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
