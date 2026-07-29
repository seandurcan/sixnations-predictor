"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
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
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageHeader
          title="Admin Results Entry"
          subtitle="Loading result management..."
        />

        <Card>
          Loading...
        </Card>
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

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageHeader
        title="Admin Results Entry"
        subtitle="Manage match results and tournament scoring"
      />

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
    </main>
  );
}