"use client";

import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  formatIrishDate,
  formatIsoDate,
} from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";
import { formatCompetitionTitle } from "@/lib/competitionTitle";

type AdminCompetition = {
  id: number;
  year: number;
  name: string;
  status: string;
  _count: { matches: number; entries: number };
};

export default function AdminPage() {
  const [loading, setLoading] =
    useState(true);

  const [authorised, setAuthorised] =
    useState(false);

  const [matches, setMatches] =
    useState<any[]>([]);

  const [competitions, setCompetitions] =
    useState<AdminCompetition[]>([]);

  const [selectedTournamentId, setSelectedTournamentId] =
    useState<number | null>(null);

  const [selectedMatchId, setSelectedMatchId] =
    useState<number | null>(null);

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [testActionRunning, setTestActionRunning] =
    useState(false);

  useEffect(() => {
    void initialise();
  }, []);

  useEffect(() => {
    if (!authorised || !selectedTournamentId) return;

    const interval = window.setInterval(
      () => void loadMatches(selectedTournamentId),
      30_000
    );

    return () => window.clearInterval(interval);
  }, [authorised, selectedTournamentId]);

  async function initialise() {
    try {
      const meResponse =
        await fetch("/api/auth/me");

      if (!meResponse.ok) {
        window.location.href =
          "/login";
        return;
      }

      const me =
        await meResponse.json();

      if (!me.authenticated) {
        window.location.href =
          "/login";
        return;
      }

      if (
        me.user.role !== "ADMIN"
      ) {
        window.location.href =
          "/dashboard";
        return;
      }

      setAuthorised(true);

      const competitionResponse = await fetch(
        "/api/admin/competitions",
        { cache: "no-store" }
      );

      if (!competitionResponse.ok) {
        const competitionError = await competitionResponse.json().catch(() => ({}));
        throw new Error(
          competitionError?.error ?? "Unable to load competitions."
        );
      }

      const competitionData = await competitionResponse.json();
      const availableCompetitions = Array.isArray(competitionData.competitions)
        ? competitionData.competitions.filter(
            (competition: AdminCompetition) =>
              competition._count?.matches > 0 &&
              competition.status !== "CANCELLED"
          )
        : [];

      setCompetitions(availableCompetitions);

      const preferredTournamentId = availableCompetitions.some(
        (competition: AdminCompetition) =>
          competition.id === competitionData.currentTournamentId
      )
        ? competitionData.currentTournamentId
        : availableCompetitions[0]?.id ?? null;

      setSelectedTournamentId(preferredTournamentId);

      if (preferredTournamentId) {
        await loadMatches(preferredTournamentId);
      } else {
        setMatches([]);
        setSelectedMatchId(null);
      }

      setLoading(false);
    } catch (error) {
      console.error(
        "Admin results page load failed:",
        {
          timestamp:
            formatIsoDate(
              new Date()
            ),
          error,
        }
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Admin Results."
      );
      setLoading(false);
    }
  }

  async function loadMatches(tournamentId?: number | null) {
    const targetTournamentId = tournamentId ?? selectedTournamentId;
    const query = targetTournamentId
      ? `?tournamentId=${targetTournamentId}`
      : "";

    const response = await fetch(
      `/api/admin/matches${query}`,
      { cache: "no-store" }
    );

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (response.status === 403) {
      window.location.href = "/dashboard";
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error ?? "Unable to load matches.");
    }

    if (!Array.isArray(data)) {
      throw new Error("Admin matches returned an unexpected response.");
    }

    const sortedData =
      [...data].sort(
        (a: any, b: any) =>
          new Date(a.kickoffTime).getTime() -
          new Date(b.kickoffTime).getTime()
      );

    setMatches(sortedData);

    setSelectedMatchId((current) => {
      const nextId =
        current && sortedData.some((match: any) => match.id === current)
          ? current
          : sortedData[0]?.id ?? null;

      if (nextId !== current) {
        const nextMatch = sortedData.find((match: any) => match.id === nextId);
        setHomeScore(nextMatch?.actualHomeScore?.toString() ?? "");
        setAwayScore(nextMatch?.actualAwayScore?.toString() ?? "");
      }

      return nextId;
    });
  }

  async function changeTournament(tournamentId: number) {
    setSelectedTournamentId(tournamentId);
    setSelectedMatchId(null);
    setHomeScore("");
    setAwayScore("");
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await loadMatches(tournamentId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the selected competition."
      );
    }
  }

  async function saveResult() {
    if (!selectedMatchId) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setSaving(true);

    const response = await fetch(
      "/api/admin/results",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          matchId:
            selectedMatchId,
          homeScore:
            Number(homeScore),
          awayScore:
            Number(awayScore),
        }),
      }
    );

    setSaving(false);

    if (
      response.status === 401
    ) {
      window.location.href =
        "/login";
      return;
    }

    if (
      response.status === 403
    ) {
      setErrorMessage(
        "Administrator access required."
      );

      window.location.href =
        "/dashboard";
      return;
    }

    const result =
      await response.json();

    if (result.success) {
      setSuccessMessage(
        "Result saved successfully."
      );

      setHomeScore("");
      setAwayScore("");

      void loadMatches(selectedTournamentId);
    } else {
      setErrorMessage(
        result.error ??
          "Failed to save result."
      );
    }
  }

  function getCurrentTournamentMatches() {
    return [...matches].sort(
      (a: any, b: any) =>
        (a.matchNumber ?? 0) - (b.matchNumber ?? 0)
    );
  }

  async function completeNextTestGame() {
    setSuccessMessage("");
    setErrorMessage("");
    setTestActionRunning(true);

    try {
      const tournamentMatches =
        getCurrentTournamentMatches();

      const nextMatch =
        tournamentMatches.find(
          (match: any) =>
            !match.completed ||
            match.actualHomeScore === null ||
            match.actualAwayScore === null
        );

      if (!nextMatch) {
        setSuccessMessage(
          "All selected-competition test games already have scores."
        );
        return;
      }

      const testScores = [
        [27, 20],
        [18, 24],
        [31, 17],
        [22, 19],
        [14, 28],
        [26, 23],
        [17, 20],
        [35, 12],
        [21, 16],
        [24, 27],
        [30, 18],
        [19, 15],
        [16, 29],
        [23, 20],
        [28, 22],
      ];

      const scoreIndex =
        Math.max(0, (nextMatch.matchNumber ?? 1) - 1) %
        testScores.length;

      const [testHomeScore, testAwayScore] =
        testScores[scoreIndex];

      const response = await fetch(
        "/api/admin/results",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            matchId: nextMatch.id,
            homeScore: testHomeScore,
            awayScore: testAwayScore,
            testMode: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            "Failed to complete next test game."
        );
      }

      await loadMatches(selectedTournamentId);

      setSuccessMessage(
        `Test game ${nextMatch.matchNumber} completed: ${nextMatch.homeTeam.shortCode} ${testHomeScore} - ${testAwayScore} ${nextMatch.awayTeam.shortCode}.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to complete next test game."
      );
    } finally {
      setTestActionRunning(false);
    }
  }

  async function resetAllTestScores() {
    setSuccessMessage("");
    setErrorMessage("");
    setTestActionRunning(true);

    try {
      const response = await fetch(
        "/api/admin/results/reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tournamentId: selectedTournamentId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            "Failed to reset test scores."
        );
      }

      setHomeScore("");
      setAwayScore("");

      await loadMatches();

      setSuccessMessage(
        `All selected competition scores and calculated scoring have been reset. Test games scored: 0 / ${matches.length}.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to reset test scores."
      );
    } finally {
      setTestActionRunning(false);
    }
  }

  function getMatchStatus(
    match: any
  ) {
    if (match.completed) {
      return "COMPLETE";
    }

    return "OPEN";
  }

  if (loading) {
    return (
      <main className="bg-white text-[var(--brand-navy)]">
        <PageContainer>
          <PageHeader
            title="Admin Results Entry"
            subtitle="Loading result management..."
          />
          <Card>
            Loading...
          </Card>
        </PageContainer>
      </main>
    );
  }

  if (!authorised) {
    if (errorMessage) {
      return (
        <main className="bg-white text-[var(--brand-navy)]">
          <PageContainer>
            <PageHeader
              title="Admin Results Entry"
              subtitle="Result management is temporarily unavailable"
            />
            <Alert variant="error" title="Unable to Load Admin Results">
              {errorMessage}
            </Alert>
          </PageContainer>
        </main>
      );
    }
    return null;
  }

  const selectedMatch =
    matches.find(
      (match) =>
        match.id ===
        selectedMatchId
    );

  const selectedCompetition =
    competitions.find(
      (competition) =>
        competition.id === selectedTournamentId
    ) ?? null;

  const tournamentOneMatches =
    getCurrentTournamentMatches();

  const totalTestGames = tournamentOneMatches.length;

  const testGamesScored =
    tournamentOneMatches.filter(
      (match: any) =>
        match.completed &&
        match.actualHomeScore !== null &&
        match.actualAwayScore !== null
    ).length;

  const manualScoreLocked = selectedMatch
    ? Date.now() <
      new Date(
        selectedMatch.tournament?.firstKickoff ??
          selectedMatch.kickoffTime
      ).getTime()
    : true;

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Admin Results Entry"
          subtitle="Manage match results and tournament scoring"
        />

        <div className="mb-6">
          <Card title="Competition">
            {competitions.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--brand-navy)]">
                  Select tournament
                  <select
                    className="mt-2 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2"
                    value={selectedTournamentId ?? ""}
                    onChange={(event) =>
                      void changeTournament(Number(event.target.value))
                    }
                  >
                    {competitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {formatCompetitionTitle(competition.name, competition.year)}
                        {competition.status ? ` · ${competition.status}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-sm text-[var(--brand-muted)]">
                  Fixtures, result entry and testing controls below apply only to the selected tournament.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--brand-muted)]">
                No competitions with fixtures are available for result entry.
              </p>
            )}
          </Card>
        </div>

        <div className="mb-6">
          <Card title="Communications">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-[var(--brand-navy)]">
                  Manage reminder emails and optional announcements
                </p>

                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  Preview branded messages, send admin-only tests and manage automatic reminders.
                </p>
              </div>

                <Link href="/admin/communications">
                  <Button>
                    Open Communications
                  </Button>
                </Link>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <Card title="Tournament Testing Controls">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-[var(--brand-navy)]">
                  Test Games Scored: {testGamesScored} / {totalTestGames}
                </p>
                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  Complete one selected-competition fixture per click. Reset removes entered results and calculated scoring for this tournament while keeping entrants and their predictions.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  fullWidth
                  disabled={
                    testActionRunning ||
                    totalTestGames === 0 ||
                    testGamesScored >= totalTestGames
                  }
                  onClick={completeNextTestGame}
                >
                  {testActionRunning
                    ? "Working..."
                    : `Complete Next Test Game (${testGamesScored}/${totalTestGames})`}
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  disabled={
                    testActionRunning ||
                    !selectedTournamentId ||
                    testGamesScored === 0
                  }
                  onClick={resetAllTestScores}
                >
                  Reset All Game Scores
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {successMessage && (
          <Alert
            variant="success"
            title="Result Saved"
            className="mb-4"
          >
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert
            variant="error"
            title="Save Failed"
            className="mb-4"
          >
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            title={
              selectedCompetition
                ? `Fixtures — ${formatCompetitionTitle(
                    selectedCompetition.name,
                    selectedCompetition.year
                  )}`
                : "Fixtures"
            }
          >
            <div className="max-h-[700px] space-y-2 overflow-y-auto">
              {matches.map(
                (match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      setSelectedMatchId(
                        match.id
                      );

                      setHomeScore(
                        match.actualHomeScore?.toString() ??
                          ""
                      );

                      setAwayScore(
                        match.actualAwayScore?.toString() ??
                          ""
                      );

                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    className={`w-full cursor-pointer rounded border p-3 text-left transition-colors hover:bg-[var(--brand-soft-lime)] ${
                      selectedMatchId ===
                      match.id
                        ? "border-[var(--brand-blue)] bg-[var(--brand-soft-blue)]"
                        : "border-[var(--brand-border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--brand-navy)]">
                          Round{" "}
                          {match.round}
                        </div>

                        <div className="mt-1">
                          {
                            match
                              .homeTeam
                              .shortCode
                          }
                          {" v "}
                          {
                            match
                              .awayTeam
                              .shortCode
                          }
                        </div>

                        {match.kickoffTime && (
                          <div className="mt-1 text-sm text-[var(--brand-muted)]">
                            {formatIrishDate(
                              match.kickoffTime
                            )}
                          </div>
                        )}

                        {match.actualHomeScore != null &&
                          match.actualAwayScore != null && (
                            <div className="mt-2 text-sm font-semibold text-[var(--brand-blue)]">
                              {match.completed ? "Result" : "Live score"}:{" "}
                              {match.actualHomeScore}
                              {" - "}
                              {match.actualAwayScore}
                              {!match.completed && match.liveStatus
                                ? " · " + match.liveStatus
                                : ""}
                            </div>
                          )}
                      </div>

                      <StatusBadge
                        status={getMatchStatus(
                          match
                        )}
                      />
                    </div>
                  </button>
                )
              )}
            </div>
          </Card>

          <Card
            title="Result Entry"
            className="md:col-span-2"
          >
            {selectedMatch ? (
              <>
                <div className="mb-6 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                    {
                      selectedMatch
                        .homeTeam
                        .name
                    }
                    {" vs "}
                    {
                      selectedMatch
                        .awayTeam
                        .name
                    }
                  </h2>

                  {selectedMatch.kickoffTime && (
                    <p className="mt-2 text-[var(--brand-muted)]">
                      Kick-off:{" "}
                      <span className="font-semibold text-[var(--brand-blue)]">
                        {formatIrishDate(
                          selectedMatch.kickoffTime
                        )}
                      </span>
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StatusBadge
                      status={getMatchStatus(
                        selectedMatch
                      )}
                    />

                    {selectedMatch.liveStatus && (
                      <span className="text-sm font-semibold text-[var(--brand-blue)]">
                        {selectedMatch.liveSource ?? "Live"}:{" "}
                        {selectedMatch.liveStatus}
                      </span>
                    )}

                    {selectedMatch.manualOverride && (
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await fetch(
                            "/api/admin/live-score-override",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type":
                                  "application/json",
                              },
                              body: JSON.stringify({
                                matchId:
                                  selectedMatch.id,
                              }),
                            }
                          );

                          await loadMatches();
                        }}
                      >
                        Resume API Updates
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {manualScoreLocked && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                      Manual score entry is locked until tournament kickoff.
                      Tournament testing controls remain available only through
                      the explicit test buttons above.
                    </div>
                  )}

                  <Input
                    type="number"
                    placeholder={`${selectedMatch.homeTeam.name} Score`}
                    value={homeScore}
                    disabled={manualScoreLocked}
                    onChange={(event) =>
                      setHomeScore(
                        event.target.value
                      )
                    }
                  />

                  <Input
                    type="number"
                    placeholder={`${selectedMatch.awayTeam.name} Score`}
                    value={awayScore}
                    disabled={manualScoreLocked}
                    onChange={(event) =>
                      setAwayScore(
                        event.target.value
                      )
                    }
                  />

                  <Button
                    onClick={
                      saveResult
                    }
                    disabled={
                      saving ||
                      manualScoreLocked
                    }
                  >
                    {saving
                      ? "Saving Result..."
                      : "Save Result"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-[var(--brand-muted)]">
                Select a fixture to enter a result.
              </p>
            )}
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
