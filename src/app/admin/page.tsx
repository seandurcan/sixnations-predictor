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

export default function AdminPage() {
  const [loading, setLoading] =
    useState(true);

  const [authorised, setAuthorised] =
    useState(false);

  const [matches, setMatches] =
    useState<any[]>([]);

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
    initialise();
  }, []);

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

      await loadMatches();

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

      window.location.href =
        "/login";
    }
  }

  async function loadMatches() {
    const response = await fetch(
      "/api/admin/matches"
    );

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
      window.location.href =
        "/dashboard";
      return;
    }

    const data =
      await response.json();

    const sortedData =
      [...data].sort(
        (a: any, b: any) =>
          new Date(
            a.kickoffTime
          ).getTime() -
          new Date(
            b.kickoffTime
          ).getTime()
      );

    setMatches(sortedData);

    if (
      sortedData.length > 0 &&
      !selectedMatchId
    ) {
      setSelectedMatchId(
        sortedData[0].id
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

      loadMatches();
    } else {
      setErrorMessage(
        result.error ??
          "Failed to save result."
      );
    }
  }

  function getTournamentOneMatches() {
    return [...matches]
      .filter(
        (match: any) =>
          match.tournamentId === 1
      )
      .sort(
        (a: any, b: any) =>
          (a.matchNumber ?? 0) -
          (b.matchNumber ?? 0)
      );
  }

  async function completeNextTestGame() {
    setSuccessMessage("");
    setErrorMessage("");
    setTestActionRunning(true);

    try {
      const tournamentMatches =
        getTournamentOneMatches();

      const nextMatch =
        tournamentMatches.find(
          (match: any) =>
            !match.completed ||
            match.actualHomeScore === null ||
            match.actualAwayScore === null
        );

      if (!nextMatch) {
        setSuccessMessage(
          "All 15 test games already have scores."
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

      const scoreIndex = Math.max(
        0,
        Math.min(
          testScores.length - 1,
          (nextMatch.matchNumber ?? 1) - 1
        )
      );

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

      await loadMatches();

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
        "All Tournament 1 scores and calculated scoring have been reset. Test games scored: 0 / 15."
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
    return null;
  }

  const selectedMatch =
    matches.find(
      (match) =>
        match.id ===
        selectedMatchId
    );

  const tournamentOneMatches =
    getTournamentOneMatches();

  const testGamesScored =
    tournamentOneMatches.filter(
      (match: any) =>
        match.completed &&
        match.actualHomeScore !== null &&
        match.actualAwayScore !== null
    ).length;

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Admin Results Entry"
          subtitle="Manage match results and tournament scoring"
        />

        <div className="mb-6">
          <Card title="Communications">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-[var(--brand-navy)]">
                  Manage verification and prediction reminder emails
                </p>

                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  Send reminder campaigns, preview branded emails and manage automatic reminders.
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
                  Test Games Scored: {testGamesScored} / 15
                </p>
                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  Complete one Tournament 1 fixture per click. Press the first button 15 times to score all 15 games. Reset removes the entered results and all calculated scoring while keeping entrants and their predictions.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  fullWidth
                  disabled={
                    testActionRunning ||
                    testGamesScored >= 15
                  }
                  onClick={completeNextTestGame}
                >
                  {testActionRunning
                    ? "Working..."
                    : `Complete Next Test Game (${testGamesScored}/15)`}
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  disabled={
                    testActionRunning ||
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
          <Card title="Fixtures">
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

                        {match.completed && (
                          <div className="mt-2 text-sm font-semibold text-[var(--brand-blue)]">
                            Result:{" "}
                            {
                              match.actualHomeScore
                            }
                            {" - "}
                            {
                              match.actualAwayScore
                            }
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

                  <div className="mt-3">
                    <StatusBadge
                      status={getMatchStatus(
                        selectedMatch
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    type="number"
                    placeholder={`${selectedMatch.homeTeam.name} Score`}
                    value={homeScore}
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
                    disabled={saving}
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