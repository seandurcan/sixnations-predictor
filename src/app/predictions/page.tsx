"use client";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import { useEffect, useState } from "react";

export default function PredictionsPage() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
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
  const [isLocked, setIsLocked] =
    useState(false);
  const [loading, setLoading] =
    useState(true);

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

      const predictionsResponse =
        await fetch(
          "/api/predictions/list"
        );

      const predictionsData =
        await predictionsResponse.json();

      setMatches(matchesData);

      setSavedPredictions(
        predictionsData
      );

      const predictedMatchIds =
        predictionsData.map(
          (p: any) => p.matchId
        );

      const firstUnpredictedMatch =
        matchesData.find(
          (m: any) =>
            !predictedMatchIds.includes(
              m.id
            )
        );

      if (firstUnpredictedMatch) {
        setCurrentMatchId(
          firstUnpredictedMatch.id
        );
      } else if (
        matchesData.length > 0
      ) {
        setCurrentMatchId(
          matchesData[0].id
        );
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
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
        (p: any) => p.matchId
      );

    const nextMatch = matches.find(
      (m) =>
        !predictedMatchIds.includes(
          m.id
        )
    );

    if (nextMatch) {
      setCurrentMatchId(
        nextMatch.id
      );
    }
  }

  function editPrediction(
    prediction: any
  ) {
    setLockMessage("");
    setIsLocked(false);

    setEditing(true);

    setEditingPredictionId(
      prediction.id
    );

    setCurrentMatchId(
      prediction.matchId
    );

    setHomeScore(
      prediction.predictedHomeScore.toString()
    );

    setAwayScore(
      prediction.predictedAwayScore.toString()
    );
  }

  async function savePrediction() {
    if (!currentMatchId) return;

    setLockMessage("");

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

    setHomeScore("");
    setAwayScore("");

    if (
      editingPredictionId !==
      null
    ) {
      setEditing(false);

      setEditingPredictionId(
        null
      );

      goToFirstUnpredictedMatch(
        refreshedPredictions
      );

      return;
    }

    goToFirstUnpredictedMatch(
      refreshedPredictions
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading predictions...
      </div>
    );
  }

  if (
    matches.length === 0 ||
    currentMatchId === null
  ) {
    return (
      <div className="p-8">
        No matches available
      </div>
    );
  }

  const currentMatch = matches.find(
    (m) => m.id === currentMatchId
  );

  if (!currentMatch) {
    return (
      <div className="p-8">
        Match not found
      </div>
    );
  }

  const existingPrediction =
    savedPredictions.find(
      (p) =>
        p.matchId ===
        currentMatchId
    );

  return (
    <main className="p-8">
      <PageHeader
        title="Predictions"
        subtitle={`Welcome ${user?.firstName ?? ""}`}
      />

      <p className="mb-4">
        Completed:{" "}
        {savedPredictions.length}
        {" / "}
        {matches.length}
      </p>

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

      {isLocked &&
        existingPrediction && (
          <Card
            title="Your Existing Prediction"
            className="mb-4 bg-gray-50"
          >
            <p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          title={`${currentMatch.homeTeam.name} vs ${currentMatch.awayTeam.name}`}
        >
          <div className="space-y-4">
            <Input
              type="number"
              disabled={isLocked}
              placeholder={`${currentMatch.homeTeam.name} Score`}
              value={homeScore}
              onChange={(e) =>
                setHomeScore(
                  e.target.value
                )
              }
            />

            <Input
              type="number"
              disabled={isLocked}
              placeholder={`${currentMatch.awayTeam.name} Score`}
              value={awayScore}
              onChange={(e) =>
                setAwayScore(
                  e.target.value
                )
              }
            />

            <Button
              disabled={isLocked}
              onClick={
                savePrediction
              }
            >
              Save Prediction
            </Button>
          </div>
        </Card>

        <Card title="Your Predictions">
          {savedPredictions.map(
            (prediction) => (
              <div
                key={
                  prediction.id
                }
                onClick={() =>
                  editPrediction(
                    prediction
                  )
                }
                className="border-b py-2 cursor-pointer hover:bg-gray-100"
              >
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
            )
          )}
        </Card>
      </div>
    </main>
  );
}