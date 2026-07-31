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
import {
  useEffect,
  useState,
} from "react";

type User = {
  firstName?: string | null;
};

type Team = {
  name: string;
  shortCode: string;
};

type Tournament = {
  predictionLockAt?: string | null;
};

type Match = {
  id: number;
  round: number;
  kickoffTime?: string | null;
  completed: boolean;
  homeTeam: Team;
  awayTeam: Team;
  tournament?: Tournament | null;
};

type PredictionMatch = {
  kickoffTime?: string | null;
  homeTeam: Team;
  awayTeam: Team;
};

type Prediction = {
  id: number;
  matchId: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  match: PredictionMatch;
};

type AuthResponse = {
  authenticated?: boolean;
  user?: User | null;
};

type SavePredictionResponse = {
  success?: boolean;
  error?: string;
};

type MatchStatus =
  | "OPEN"
  | "LOCKED"
  | "COMPLETE";

async function readJson<T>(
  response: Response
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      `Invalid JSON response from ${response.url || "API"}.`
    );
  }
}

function getKickoffTimestamp(
  match: Match
): number {
  if (!match.kickoffTime) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(
    match.kickoffTime
  ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.MAX_SAFE_INTEGER;
}

function isMatchLocked(
  match: Match
): boolean {
  if (match.completed) {
    return true;
  }

  const predictionLockAt =
    match.tournament?.predictionLockAt;

  if (predictionLockAt) {
    const lockTimestamp = new Date(
      predictionLockAt
    ).getTime();

    if (Number.isFinite(lockTimestamp)) {
      return lockTimestamp <= Date.now();
    }
  }

  if (match.kickoffTime) {
    const kickoffTimestamp = new Date(
      match.kickoffTime
    ).getTime();

    if (Number.isFinite(kickoffTimestamp)) {
      return kickoffTimestamp <= Date.now();
    }
  }

  return false;
}
function getMatchStatus(
  match: Match
): MatchStatus {
  if (match.completed) {
    return "COMPLETE";
  }

  if (isMatchLocked(match)) {
    return "LOCKED";
  }

  return "OPEN";
}

export default function PredictionsPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [
    savedPredictions,
    setSavedPredictions,
  ] = useState<Prediction[]>([]);

  const [
    currentMatchId,
    setCurrentMatchId,
  ] = useState<number | null>(null);

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [
    feedbackMessage,
    setFeedbackMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [isLocked, setIsLocked] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

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
          await readJson<AuthResponse>(
            meResponse
          );

        if (!me.authenticated) {
          window.location.href =
            "/login";
          return;
        }

        const matchesResponse =
          await fetch("/api/matches");

        if (!matchesResponse.ok) {
          throw new Error(
            `Matches request failed with status ${matchesResponse.status}.`
          );
        }

        const matchesData =
          await readJson<Match[]>(
            matchesResponse
          );

        if (!Array.isArray(matchesData)) {
          throw new Error(
            "Matches API returned invalid data."
          );
        }

        const predictionsResponse =
          await fetch(
            "/api/predictions/list"
          );

        if (!predictionsResponse.ok) {
          throw new Error(
            `Predictions request failed with status ${predictionsResponse.status}.`
          );
        }

        const predictionsData =
          await readJson<Prediction[]>(
            predictionsResponse
          );

        if (
          !Array.isArray(
            predictionsData
          )
        ) {
          throw new Error(
            "Predictions API returned invalid data."
          );
        }

        const sortedMatches = [
          ...matchesData,
        ].sort(
          (first, second) =>
            getKickoffTimestamp(
              first
            ) -
            getKickoffTimestamp(
              second
            )
        );

        const predictedMatchIds =
          new Set(
            predictionsData.map(
              (prediction) =>
                prediction.matchId
            )
          );

        const firstUnpredictedMatch =
          sortedMatches.find(
            (match) =>
              !predictedMatchIds.has(
                match.id
              ) &&
              !match.completed
          );

        const initialMatch =
          firstUnpredictedMatch ??
          sortedMatches[0] ??
          null;

        if (cancelled) {
          return;
        }

        setUser(me.user ?? null);
        setMatches(sortedMatches);
        setSavedPredictions(
          predictionsData
        );

        if (initialMatch) {
          const initialPrediction =
            predictionsData.find(
              (prediction) =>
                prediction.matchId ===
                initialMatch.id
            );

          setCurrentMatchId(
            initialMatch.id
          );

          setIsLocked(
            isMatchLocked(initialMatch)
          );

          if (initialPrediction) {
            setEditing(true);
            setHomeScore(
              String(
                initialPrediction
                  .predictedHomeScore
              )
            );
            setAwayScore(
              String(
                initialPrediction
                  .predictedAwayScore
              )
            );
          }
        }
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

        if (!cancelled) {
          window.location.href =
            "/login";
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialisePage();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshPredictions(): Promise<
    Prediction[]
  > {
    const response = await fetch(
      "/api/predictions/list"
    );

    if (!response.ok) {
      throw new Error(
        `Predictions refresh failed with status ${response.status}.`
      );
    }

    const data =
      await readJson<Prediction[]>(
        response
      );

    if (!Array.isArray(data)) {
      throw new Error(
        "Predictions API returned invalid data."
      );
    }

    setSavedPredictions(data);

    return data;
  }

  function goToFirstUnpredictedMatch(
    predictions: Prediction[]
  ) {
    const predictedMatchIds =
      new Set(
        predictions.map(
          (prediction) =>
            prediction.matchId
        )
      );

    const nextMatch = matches.find(
      (match) =>
        !predictedMatchIds.has(
          match.id
        ) &&
        !match.completed
    );

    if (!nextMatch) {
      return;
    }

    setCurrentMatchId(nextMatch.id);
    setIsLocked(
      isMatchLocked(nextMatch)
    );
  }

  function getPredictionForMatch(
    matchId: number
  ): Prediction | undefined {
    return savedPredictions.find(
      (prediction) =>
        prediction.matchId ===
        matchId
    );
  }

  function selectMatch(
    matchId: number
  ) {
    const match = matches.find(
      (item) => item.id === matchId
    );

    if (!match) {
      setFeedbackMessage(
        "The selected fixture could not be found."
      );
      return;
    }

    const existingPrediction =
      getPredictionForMatch(matchId);

    setCurrentMatchId(matchId);
    setFeedbackMessage("");
    setSuccessMessage("");
    setIsLocked(
      isMatchLocked(match)
    );

    if (existingPrediction) {
      setEditing(true);
      setHomeScore(
        String(
          existingPrediction
            .predictedHomeScore
        )
      );
      setAwayScore(
        String(
          existingPrediction
            .predictedAwayScore
        )
      );
      return;
    }

    setEditing(false);
    setHomeScore("");
    setAwayScore("");
  }

  function editPrediction(
    prediction: Prediction
  ) {
    selectMatch(
      prediction.matchId
    );
  }

  async function savePrediction() {
    if (
      currentMatchId === null ||
      saving
    ) {
      return;
    }

    if (
      homeScore.trim() === "" ||
      awayScore.trim() === ""
    ) {
      setFeedbackMessage(
        "Enter both scores before saving your prediction."
      );
      return;
    }

    const parsedHomeScore =
      Number(homeScore);

    const parsedAwayScore =
      Number(awayScore);

    if (
      !Number.isInteger(
        parsedHomeScore
      ) ||
      !Number.isInteger(
        parsedAwayScore
      ) ||
      parsedHomeScore < 0 ||
      parsedAwayScore < 0
    ) {
      setFeedbackMessage(
        "Scores must be whole numbers of zero or greater."
      );
      return;
    }

    setFeedbackMessage("");
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
              parsedHomeScore,
            awayScore:
              parsedAwayScore,
          }),
        }
      );

      const result =
        await readJson<SavePredictionResponse>(
          response
        );

      if (
        !response.ok ||
        result.success !== true
      ) {
        if (response.status === 403) {
          setIsLocked(true);

          setFeedbackMessage(
  "This fixture has already kicked off. Predictions can no longer be edited."
);
        } else {
          setFeedbackMessage(
            result.error ??
              "Failed to save prediction."
          );
        }

        return;
      }

      const wasEditing = editing;

      const refreshedPredictions =
        await refreshPredictions();

      setSuccessMessage(
        wasEditing
          ? "Prediction updated successfully."
          : "Prediction saved successfully."
      );

      setHomeScore("");
      setAwayScore("");
      setEditing(false);

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

      setFeedbackMessage(
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
            {
              currentMatch.homeTeam
                .shortCode
            }
            {" v "}
            {
              currentMatch.awayTeam
                .shortCode
            }
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

      {feedbackMessage && (
        <Alert
          variant="error"
          title={
            fixtureLocked
              ? "🔒 Prediction Locked"
              : "Prediction Error"
          }
          className="mb-4"
        >
          {feedbackMessage}
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
                existingPrediction
                  .predictedHomeScore
              }
              {" - "}
              {
                existingPrediction
                  .predictedAwayScore
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
                        {
                          match.homeTeam
                            .shortCode
                        }
                        {" v "}
                        {
                          match.awayTeam
                            .shortCode
                        }
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
                  {currentMatch.kickoffTime
                    ? formatIrishDate(
                        currentMatch.kickoffTime
                      )
                    : "Kick-off time unavailable"}
                </p>

                <p className="mt-2 text-sm text-[var(--brand-muted)]">
                  Round{" "}
                  {currentMatch.round}
                </p>
              </div>

              {!fixtureLocked && (
  <CountdownTimer
    targetDate={
      currentMatch.tournament
        ?.predictionLockAt ??
      currentMatch.kickoffTime ??
      ""
    }
    label="Time until predictions lock"
  />
)}

              {fixtureLocked && (
                <Alert
                  variant="warning"
                  title="Tournament Locked"
                >
                  Predictions are locked because the tournament has started.
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  step={1}
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
                  min={0}
                  step={1}
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
            {savedPredictions.length ===
            0 ? (
              <p className="text-[var(--brand-muted)]">
                You have not saved any predictions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {savedPredictions.map(
                  (prediction) => (
                    <button
                      key={prediction.id}
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
                          prediction
                            .predictedHomeScore
                        }
                        {" - "}
                        {
                          prediction
                            .predictedAwayScore
                        }
                        {" "}
                        {
                          prediction.match
                            .awayTeam
                            .shortCode
                        }
                      </div>

                      {prediction.match
                        ?.kickoffTime && (
                        <p className="mt-1 text-sm text-[var(--brand-muted)]">
                          {formatIrishDate(
                            prediction.match
                              .kickoffTime
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