"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CountdownTimer from "@/components/ui/CountdownTimer";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  formatIrishDate,
  formatIsoDate,
} from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

export default function PredictionsPage() {
  const [user, setUser] =
    useState<any>(null);

  const [matches, setMatches] =
    useState<any[]>([]);

  const [savedPredictions, setSavedPredictions] =
    useState<any[]>([]);

  const [currentMatchId, setCurrentMatchId] =
    useState<number | null>(null);

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [
    editingPredictionId,
    setEditingPredictionId,
  ] = useState<number | null>(null);

  const [lockMessage, setLockMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isLocked, setIsLocked] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    initialisePage();
  }, []);

  async function initialisePage() {
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

      setUser(me.user);

      const matchesResponse =
        await fetch("/api/matches");

      const matchesData =
        await matchesResponse.json();

      const sortedMatches =
        [...matchesData].sort(
          (a: any, b: any) =>
            new Date(
              a.kickoffTime
            ).getTime() -
            new Date(
              b.kickoffTime
            ).getTime()
        );

      const predictionsResponse =
        await fetch(
          "/api/predictions/list"
        );

      const predictionsData =
        await predictionsResponse.json();

      setMatches(sortedMatches);

      setSavedPredictions(
        predictionsData
      );

      const predictedMatchIds =
        predictionsData.map(
          (prediction: any) =>
            prediction.matchId
        );

      const firstUnpredictedMatch =
        sortedMatches.find(
          (match: any) =>
            !predictedMatchIds.includes(
              match.id
            ) &&
            !match.completed
        );

      if (firstUnpredictedMatch) {
        setCurrentMatchId(
          firstUnpredictedMatch.id
        );
      } else if (
        sortedMatches.length > 0
      ) {
        setCurrentMatchId(
          sortedMatches[0].id
        );
      }

      setLoading(false);
    } catch (error) {
      console.error(
        "Predictions page load failed:",
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

  async function refreshPredictions() {
    const response = await fetch(
      "/api/predictions/list"
    );

    const data =
      await response.json();

    setSavedPredictions(data);

    return data;
  }

  function goToFirstUnpredictedMatch(
    predictions: any[]
  ) {
    const predictedMatchIds =
      predictions.map(
        (prediction: any) =>
          prediction.matchId
      );

    const nextMatch = matches.find(
      (match) =>
        !predictedMatchIds.includes(
          match.id
        ) &&
        !match.completed
    );

    if (nextMatch) {
      setCurrentMatchId(
        nextMatch.id
      );
    }
  }

  function getPredictionForMatch(
    matchId: number
  ) {
    return savedPredictions.find(
      (prediction) =>
        prediction.matchId === matchId
    );
  }

  function isMatchLocked(
    match: any
  ) {
    if (match.completed) {
      return true;
    }

    if (!match.kickoffTime) {
      return false;
    }

    return (
      new Date(
        match.kickoffTime
      ).getTime() <=
      new Date().getTime()
    );
  }

  function getMatchStatus(
    match: any
  ) {
    if (match.completed) {
      return "COMPLETE";
    }

    if (isMatchLocked(match)) {
      return "LOCKED";
    }

    return "OPEN";
  }

  function selectMatch(
    matchId: number
  ) {
    const match = matches.find(
      (item) => item.id === matchId
    );

    const existingPrediction =
      getPredictionForMatch(matchId);

    setCurrentMatchId(matchId);
    setLockMessage("");
    setSuccessMessage("");
    setIsLocked(
      match ? isMatchLocked(match) : false
    );

    if (existingPrediction) {
      setEditing(true);
      setEditingPredictionId(
        existingPrediction.id
      );
      setHomeScore(
        existingPrediction.predictedHomeScore.toString()
      );
      setAwayScore(
        existingPrediction.predictedAwayScore.toString()
      );
    } else {
      setEditing(false);
      setEditingPredictionId(null);
      setHomeScore("");
      setAwayScore("");
    }
  }

  function editPrediction(
    prediction: any
  ) {
    selectMatch(
      prediction.matchId
    );
  }

  async function savePrediction() {
    if (!currentMatchId) {
      return;
    }

    if (
      homeScore.trim() === "" ||
      awayScore.trim() === ""
    ) {
      setLockMessage(
        "Enter both scores before saving your prediction."
      );
      return;
    }

    setLockMessage("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        "/api/predictions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            matchId: currentMatchId,
            homeScore:
              Number(homeScore),
            awayScore:
              Number(awayScore),
          }),
        }
      );

      const result =
        await response.json();

      if (!result.success) {
        if (
          response.status === 403
        ) {
          setIsLocked(true);

          setLockMessage(
            "This fixture has already kicked off. Predictions can no longer be edited."
          );
        } else {
          setLockMessage(
            result.error ??
              "Failed to save prediction."
          );
        }

        return;
      }

      const refreshedPredictions =
        await refreshPredictions();

      setSuccessMessage(
        editing
          ? "Prediction updated successfully."
          : "Prediction saved successfully."
      );

      setHomeScore("");
      setAwayScore("");
      setEditing(false);
      setEditingPredictionId(null);

      goToFirstUnpredictedMatch(
        refreshedPredictions
      );
    } catch (error) {
      console.error(
        "Prediction save failed:",
        {
          timestamp:
            formatIsoDate(
              new Date()
            ),
          error,
        }
      );

      setLockMessage(
        "Unable to save prediction. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageHeader
          title="Predictions"
          subtitle="Loading your predictions..."
        />

        <Card>
          Loading predictions...
        </Card>
      </main>
    );
  }

  if (
    matches.length === 0 ||
    currentMatchId === null
  ) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageHeader
          title="Predictions"
          subtitle="No fixtures are currently available."
        />

        <Card>
          No matches available.
        </Card>
      </main>
    );
  }

  const currentMatch = matches.find(
    (match) =>
      match.id === currentMatchId
  );

  if (!currentMatch) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageHeader
          title="Predictions"
          subtitle="The selected fixture could not be found."
        />

        <Card>
          Match not found.
        </Card>
      </main>
    );
  }

  const existingPrediction =
    getPredictionForMatch(
      currentMatchId
    );

  const fixtureLocked =
    isLocked ||
    isMatchLocked(currentMatch);

  const predictionProgress =
    `${savedPredictions.length} / ${matches.length}`;

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageHeader
        title="Predictions"
        subtitle={`Welcome ${
          user?.firstName ?? "Player"
        }`}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
            Prediction Progress
          </p>

          <p className="mt-2 text-3xl font-black text-[var(--brand-blue)]">
            {predictionProgress}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
            Current Fixture
          </p>

          <p className="mt-2 text-lg font-bold text-[var(--brand-navy)]">
            {currentMatch.homeTeam.shortCode}
            {" v "}
            {currentMatch.awayTeam.shortCode}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
            Fixture Status
          </p>

          <div className="mt-2">
            <StatusBadge
              status={getMatchStatus(
                currentMatch
              )}
            />
          </div>
        </Card>
      </div>

      {successMessage && (
        <Alert
          variant="success"
          title="Prediction Saved"
          className="mb-4"
        >
          {successMessage}
        </Alert>
      )}

      {editing && (
        <Alert
          variant="warning"
          className="mb-4"
        >
          Editing Prediction
        </Alert>
      )}

      {lockMessage && (
        <Alert
          variant="error"
          title="🔒 Prediction Locked"
          className="mb-4"
        >
          {lockMessage}
        </Alert>
      )}

      {fixtureLocked &&
        existingPrediction && (
          <Card
            title="Your Existing Prediction"
            className="mb-4 bg-slate-50"
          >
            <p className="font-semibold text-[var(--brand-navy)]">
              {
                existingPrediction.predictedHomeScore
              }
              {" - "}
              {
                existingPrediction.predictedAwayScore
              }
            </p>
          </Card>
        )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Fixtures">
          <div className="max-h-[720px] space-y-2 overflow-y-auto">
            {matches.map((match) => {
              const prediction =
                getPredictionForMatch(
                  match.id
                );

              const active =
                match.id ===
                currentMatchId;

              return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() =>
                    selectMatch(match.id)
                  }
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-[var(--brand-blue)] bg-[var(--brand-soft-blue)]"
                      : "border-[var(--brand-border)] hover:bg-[var(--brand-soft-lime)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[var(--brand-navy)]">
                        {match.homeTeam.shortCode}
                        {" v "}
                        {match.awayTeam.shortCode}
                      </p>

                      <p className="mt-1 text-sm text-[var(--brand-muted)]">
                        Round {match.round}
                      </p>

                      {match.kickoffTime && (
                        <p className="mt-1 text-sm text-[var(--brand-muted)]">
                          {formatIrishDate(
                            match.kickoffTime
                          )}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <StatusBadge
                        status={getMatchStatus(
                          match
                        )}
                      />

                      {prediction && (
                        <p className="mt-2 text-sm font-semibold text-[var(--brand-blue)]">
                          Predicted
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title={`${currentMatch.homeTeam.name} vs ${currentMatch.awayTeam.name}`}
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
                <p className="text-sm font-semibold text-[var(--brand-blue)]">
                  Kick-off
                </p>

                <p className="mt-1 font-bold text-[var(--brand-navy)]">
                  {formatIrishDate(
                    currentMatch.kickoffTime
                  )}
                </p>

                <p className="mt-2 text-sm text-[var(--brand-muted)]">
                  Round{" "}
                  {currentMatch.round}
                </p>
              </div>

              {!fixtureLocked && (
                <CountdownTimer
                  targetDate={
                    currentMatch.kickoffTime
                  }
                  label="Time until predictions lock"
                />
              )}

              {fixtureLocked && (
                <Alert
                  variant="warning"
                  title="Fixture Locked"
                >
                  Predictions for this fixture are no longer editable.
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  disabled={fixtureLocked}
                  placeholder={`${currentMatch.homeTeam.name} Score`}
                  value={homeScore}
                  onChange={(event) =>
                    setHomeScore(
                      event.target.value
                    )
                  }
                />

                <Input
                  type="number"
                  disabled={fixtureLocked}
                  placeholder={`${currentMatch.awayTeam.name} Score`}
                  value={awayScore}
                  onChange={(event) =>
                    setAwayScore(
                      event.target.value
                    )
                  }
                />
              </div>

              <Button
                disabled={
                  fixtureLocked ||
                  saving
                }
                onClick={
                  savePrediction
                }
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Prediction"
                    : "Save Prediction"}
              </Button>
            </div>
          </Card>

          <Card title="Your Predictions">
            {savedPredictions.length === 0 ? (
              <p className="text-[var(--brand-muted)]">
                You have not saved any predictions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {savedPredictions.map(
                  (prediction) => (
                    <button
                      key={
                        prediction.id
                      }
                      type="button"
                      onClick={() =>
                        editPrediction(
                          prediction
                        )
                      }
                      className="w-full rounded-lg border border-[var(--brand-border)] p-3 text-left transition-colors hover:bg-[var(--brand-soft-lime)]"
                    >
                      <div className="font-semibold text-[var(--brand-navy)]">
                        {
                          prediction.match
                            .homeTeam
                            .shortCode
                        }
                        {" "}
                        {
                          prediction.predictedHomeScore
                        }
                        {" - "}
                        {
                          prediction.predictedAwayScore
                        }
                        {" "}
                        {
                          prediction.match
                            .awayTeam
                            .shortCode
                        }
                      </div>

                      {prediction.match?.kickoffTime && (
                        <p className="mt-1 text-sm text-[var(--brand-muted)]">
                          {formatIrishDate(
                            prediction.match.kickoffTime
                          )}
                        </p>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}