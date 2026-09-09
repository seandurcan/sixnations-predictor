"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CountdownTimer from "@/components/ui/CountdownTimer";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  formatIrishDate,
  formatIsoDate,
} from "@/lib/formatIrishDate";
import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function PredictionsPage() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [savedPredictions, setSavedPredictions] = useState<any[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingPredictionId, setEditingPredictionId] = useState<number | null>(null);
  const [lockMessage, setLockMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quickPicking, setQuickPicking] = useState(false);

  const homeScoreInputRef = useRef<HTMLInputElement>(null);
  const awayScoreInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    initialisePage();
  }, []);

  async function initialisePage() {
    try {
      const meResponse = await fetch("/api/auth/me");

      if (!meResponse.ok) {
        window.location.href = "/login";
        return;
      }

      const me = await meResponse.json();

      if (!me.authenticated) {
        window.location.href = "/login";
        return;
      }

      setUser(me.user);

      if (
        me.user?.paymentStatus !==
        "COMPLETED"
      ) {
        setPaymentRequired(true);
        setLoading(false);
        return;
      }

      const matchesResponse = await fetch("/api/matches");
      const matchesData = await matchesResponse.json();

      const sortedMatches = [...matchesData].sort(
        (a: any, b: any) =>
          new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
      );

      const predictionsResponse = await fetch("/api/predictions/list");
      const predictionsData = await predictionsResponse.json();

      setMatches(sortedMatches);
      setSavedPredictions(predictionsData);

      const predictedMatchIds = predictionsData.map(
        (prediction: any) => prediction.matchId
      );

      const firstUnpredictedMatch = sortedMatches.find(
        (match: any) =>
          !predictedMatchIds.includes(match.id) && !match.completed
      );

      if (firstUnpredictedMatch) {
        setCurrentMatchId(firstUnpredictedMatch.id);
      } else {
        setCurrentMatchId(null);
      }

      setLoading(false);
    } catch (error) {
      console.error("Predictions page load failed:", {
        timestamp: formatIsoDate(new Date()),
        error,
      });

      window.location.href = "/login";
    }
  }

  async function refreshPredictions() {
    const response = await fetch("/api/predictions/list");
    const data = await response.json();
    setSavedPredictions(data);
    return data;
  }

  async function runQuickPick() {
    try {
      setQuickPicking(true);
      setLockMessage("");
      setSuccessMessage("");
      const response = await fetch("/api/predictions/quick-pick", {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Quick Pick failed.");
      }

      const refreshedPredictions = await refreshPredictions();
      setSuccessMessage(
        `Quick Pick saved predictions for ${result.saved} fixtures.`
      );
      goToFirstUnpredictedMatch(refreshedPredictions);
    } catch (error) {
      setLockMessage(error instanceof Error ? error.message : "Quick Pick failed.");
    } finally {
      setQuickPicking(false);
    }
  }

  function goToFirstUnpredictedMatch(predictions: any[]) {
    const predictedMatchIds = predictions.map(
      (prediction: any) => prediction.matchId
    );

    const nextMatch = matches.find(
      (match) =>
        !predictedMatchIds.includes(match.id) && !match.completed
    );

    if (nextMatch) {
      setCurrentMatchId(nextMatch.id);
      return;
    }

    setCurrentMatchId(null);
    setEditing(false);
    setEditingPredictionId(null);
    setHomeScore("");
    setAwayScore("");
    setSuccessMessage("");
  }

  function getPredictionForMatch(matchId: number) {
    return savedPredictions.find(
      (prediction) => prediction.matchId === matchId
    );
  }

  function isMatchLocked(match: any) {
    if (match.completed) {
      return true;
    }

    if (!match.kickoffTime) {
      return false;
    }

    return (
      new Date(match.kickoffTime).getTime() <= new Date().getTime()
    );
  }

  function getMatchStatus(match: any) {
    if (match.completed) {
      return "COMPLETE";
    }

    if (isMatchLocked(match)) {
      return "LOCKED";
    }

    return "OPEN";
  }

  function selectMatch(matchId: number) {
    const match = matches.find((item) => item.id === matchId);
    const existingPrediction = getPredictionForMatch(matchId);

    setCurrentMatchId(matchId);
    setLockMessage("");
    setSuccessMessage("");
    setIsLocked(match ? isMatchLocked(match) : false);

    if (existingPrediction) {
      setEditing(true);
      setEditingPredictionId(existingPrediction.id);
      setHomeScore(existingPrediction.predictedHomeScore.toString());
      setAwayScore(existingPrediction.predictedAwayScore.toString());
    } else {
      setEditing(false);
      setEditingPredictionId(null);
      setHomeScore("");
      setAwayScore("");
    }
  }

  function editPrediction(prediction: any) {
    selectMatch(prediction.matchId);
  }

  async function savePrediction() {
    if (!currentMatchId) {
      return;
    }

    if (homeScore.trim() === "" || awayScore.trim() === "") {
      setLockMessage("Enter both scores before saving your prediction.");
      return;
    }

    setLockMessage("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: currentMatchId,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 403) {
          setIsLocked(true);
          setLockMessage(
            "This fixture has already kicked off. Predictions can no longer be edited."
          );
        } else {
          setLockMessage(
            result.error ?? "Failed to save prediction."
          );
        }
        return;
      }

      const refreshedPredictions = await refreshPredictions();

      setSuccessMessage(
        editing
          ? "Prediction updated successfully."
          : "Prediction saved successfully."
      );

      setHomeScore("");
      setAwayScore("");
      setEditing(false);
      setEditingPredictionId(null);

      goToFirstUnpredictedMatch(refreshedPredictions);
    } catch (error) {
      console.error("Prediction save failed:", {
        timestamp: formatIsoDate(new Date()),
        error,
      });

      setLockMessage("Unable to save prediction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <div className="text-center">
          <PageHeader
            title="Predictions"
            subtitle={`Welcome ${user?.firstName ?? "Player"}`}
          />
        </div>

        <PageContainer>
          <Card>Loading predictions...</Card>
        </PageContainer>
      </main>
    );
  }

  if (paymentRequired) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageContainer>
          <div className="text-center">
            <PageHeader
              title="Predictions"
              subtitle={`Welcome ${user?.firstName ?? "Player"}`}
            />
          </div>

          <Card title="Competition Entry Required">
            <div className="space-y-5">
              <p className="text-lg text-[var(--brand-muted)]">
                You are welcome to browse Perfect XV before entering the competition.
              </p>

              <p className="text-[var(--brand-muted)]">
                A &euro;5 competition entry payment is required before you can enter or edit predictions.
              </p>

              <p className="font-semibold text-[var(--brand-navy)]">
                When you are ready to enter, continue to the secure payment page. After payment is confirmed, Predictions will unlock automatically.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => {
                    window.location.href = "/payment-required";
                  }}
                >
                  Continue to Payment
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </PageContainer>
      </main>
    );
  }

  if (matches.length === 0) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageHeader
          title="Predictions"
          subtitle="No fixtures are currently available."
        />
        <Card>No matches available.</Card>
      </main>
    );
  }

  const currentMatch =
    currentMatchId === null
      ? null
      : matches.find(
          (match) => match.id === currentMatchId
        );

  if (
    currentMatchId !== null &&
    !currentMatch
  ) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageHeader
          title="Predictions"
          subtitle="The selected fixture could not be found."
        />
        <Card>Match not found.</Card>
      </main>
    );
  }

  const existingPrediction =
    currentMatchId !== null
      ? getPredictionForMatch(currentMatchId)
      : null;

  const fixtureLocked =
    currentMatch
      ? isLocked || isMatchLocked(currentMatch)
      : false;

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageContainer>
        <div className="text-center">
          <PageHeader
            title="Predictions"
            subtitle={`Welcome ${user?.firstName ?? "Player"}`}
          />
        </div>

        {successMessage && (
          <Alert variant="success" title="Prediction Saved" className="mb-4">
            {successMessage}
          </Alert>
        )}

        {lockMessage && (
          <Alert variant="error" title="🔒 Prediction Locked" className="mb-4">
            {lockMessage}
          </Alert>
        )}

        {fixtureLocked && existingPrediction && (
          <Card title="Your Existing Prediction" className="mb-4 bg-slate-50">
            <p className="font-semibold text-[var(--brand-navy)]">
              {existingPrediction.predictedHomeScore} - {existingPrediction.predictedAwayScore}
            </p>
          </Card>
        )}

        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              Prediction Progress
            </span>

            <span>
              {savedPredictions.length} / {matches.length}
            </span>
          </div>
        </Card>

        <Card title="Quick Pick (Testing)" className="mb-6">
          <p className="mb-4 text-sm text-[var(--brand-muted)]">
            Generate and save random scores for every unlocked fixture. Existing unlocked predictions will be replaced.
          </p>
          <Button
            fullWidth
            disabled={quickPicking || matches.every((match) => isMatchLocked(match))}
            onClick={runQuickPick}
          >
            {quickPicking ? "Generating Quick Pick..." : "Generate Quick Pick"}
          </Button>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <div className="space-y-6">
            <Card title="Fixtures">
              <div className="max-h-[720px] space-y-2 overflow-y-auto">
                {matches.map((match) => {
                  const active = match.id === currentMatchId;

                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => selectMatch(match.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? "border-[var(--brand-blue)] bg-[var(--brand-soft-blue)]"
                          : "border-[var(--brand-border)] hover:bg-[var(--brand-soft-lime)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {match.homeTeam.shortCode} v {match.awayTeam.shortCode}
                        </span>

                        <StatusBadge
                          status={getMatchStatus(match)}
                        />
                      </div>

                      {match.kickoffTime && (
                        <p className="mt-1 text-sm text-[var(--brand-muted)]">
                          {formatIrishDate(match.kickoffTime)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card title="Your Predictions">
              <div className="max-h-[720px] space-y-2 overflow-y-auto">
                {savedPredictions.length === 0 ? (
                  <p>
                    You have not saved any predictions yet.
                  </p>
                ) : (
                  savedPredictions.map((prediction) => {
                    const active = prediction.matchId === currentMatchId;

                    return (
                      <button
                        key={prediction.id}
                        type="button"
                        onClick={() => editPrediction(prediction)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? "border-[var(--brand-blue)] bg-[var(--brand-soft-blue)]"
                            : "border-[var(--brand-border)] hover:bg-[var(--brand-soft-lime)]"
                        }`}
                      >
                        <div className="font-semibold text-[var(--brand-navy)]">
                          {prediction.match?.homeTeam?.shortCode}
                          {" "}
                          {prediction.predictedHomeScore}
                          {" - "}
                          {prediction.predictedAwayScore}
                          {" "}
                          {prediction.match?.awayTeam?.shortCode}
                        </div>

                        {prediction.match?.kickoffTime && (
                          <p className="mt-1 text-sm text-[var(--brand-muted)]">
                            {formatIrishDate(prediction.match.kickoffTime)}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {!fixtureLocked && (
              <Card>
                <CountdownTimer
                  targetDate={
                    currentMatch?.kickoffTime ??
                    matches.find(
                      (match) =>
                        !getPredictionForMatch(match.id)
                    )?.kickoffTime ??
                    matches[0]?.kickoffTime
                  }
                  label="Time until predictions lock"
                />
              </Card>
            )}

            {currentMatchId !== null &&
              currentMatch && (
                <Card
                  title={`${
                    typeof currentMatch.homeTeam === 'object'
                      ? currentMatch.homeTeam?.name ?? currentMatch.homeTeam?.shortCode
                      : currentMatch.homeTeam
                  } vs ${
                    typeof currentMatch.awayTeam === 'object'
                      ? currentMatch.awayTeam?.name ?? currentMatch.awayTeam?.shortCode
                      : currentMatch.awayTeam
                  }`}
                >
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
                      <p className="text-sm font-semibold text-[var(--brand-blue)]">
                        Kick-off
                      </p>
                      <p className="mt-1 font-bold text-[var(--brand-navy)]">
                        {formatIrishDate(currentMatch.kickoffTime)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--brand-muted)]">
                        Round {currentMatch.round}
                      </p>
                      <div className="mt-3">
                        <StatusBadge
                          status={getMatchStatus(currentMatch)}
                        />
                      </div>
                    </div>

                    {fixtureLocked && (
                      <Alert variant="warning" title="Fixture Locked">
                        Predictions for this fixture are no longer editable.
                      </Alert>
                    )}

                    {editing && (
                      <Alert
                        variant="info"
                        title="Editing Prediction"
                      >
                        Updating existing prediction.
                      </Alert>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        ref={homeScoreInputRef}
                        type="number"
                        disabled={fixtureLocked}
                        placeholder={`${
                          typeof currentMatch.homeTeam === 'object'
                            ? currentMatch.homeTeam?.name ?? currentMatch.homeTeam?.shortCode
                            : currentMatch.homeTeam
                        } Score`}
                        value={homeScore}
                        onChange={(event) => setHomeScore(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            awayScoreInputRef.current?.focus();
                          }
                        }}
                      />

                      <Input
                        ref={awayScoreInputRef}
                        type="number"
                        disabled={fixtureLocked}
                        placeholder={`${
                          typeof currentMatch.awayTeam === 'object'
                            ? currentMatch.awayTeam?.name ?? currentMatch.awayTeam?.shortCode
                            : currentMatch.awayTeam
                        } Score`}
                        value={awayScore}
                        onChange={(event) => setAwayScore(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveButtonRef.current?.focus();
                          }
                        }}
                      />
                    </div>

                    <Button
                      ref={saveButtonRef}
                      disabled={fixtureLocked || saving}
                      onClick={savePrediction}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          savePrediction();
                        }
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : editing
                        ? "Update Prediction"
                        : "Save Prediction"}
                    </Button>
                  </div>
                </Card>
              )}
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
