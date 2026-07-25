"use client";

import { useEffect, useState } from "react";

export default function PredictionsPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [savedPredictions, setSavedPredictions] =
    useState<any[]>([]);

  const [currentMatchId, setCurrentMatchId] =
    useState<number | null>(null);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const [editing, setEditing] = useState(false);

  const [editingPredictionId, setEditingPredictionId] =
    useState<number | null>(null);

  const [lockMessage, setLockMessage] =
    useState("");

  const [isLocked, setIsLocked] =
    useState(false);

  useEffect(() => {
    initialisePage();
  }, []);

  async function initialisePage() {
    const matchesResponse = await fetch(
      "/api/matches"
    );

    const matchesData =
      await matchesResponse.json();

    const predictionsResponse = await fetch(
      "/api/predictions/list"
    );

    const predictionsData =
      await predictionsResponse.json();

    setMatches(matchesData);
    setSavedPredictions(predictionsData);

    const predictedMatchIds =
      predictionsData.map(
        (p: any) => p.matchId
      );

    const firstUnpredictedMatch =
      matchesData.find(
        (m: any) =>
          !predictedMatchIds.includes(m.id)
      );

    if (firstUnpredictedMatch) {
      setCurrentMatchId(
        firstUnpredictedMatch.id
      );
    } else if (matchesData.length > 0) {
      setCurrentMatchId(
        matchesData[0].id
      );
    }
  }

  async function refreshPredictions() {
    const response = await fetch(
      "/api/predictions/list"
    );

    const data = await response.json();

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
        !predictedMatchIds.includes(m.id)
    );

    if (nextMatch) {
      setCurrentMatchId(nextMatch.id);
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

    const userId =
      localStorage.getItem("userId");

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
          userId: Number(userId),
          matchId: currentMatchId,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      }
    );

    const result =
      await response.json();

    if (!result.success) {
      if (response.status === 403) {
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

    if (editingPredictionId !== null) {
      setEditing(false);

      setEditingPredictionId(null);

      goToFirstUnpredictedMatch(
        refreshedPredictions
      );

      return;
    }

    goToFirstUnpredictedMatch(
      refreshedPredictions
    );
  }

  if (
    matches.length === 0 ||
    currentMatchId === null
  ) {
    return (
      <div className="p-8">
        Loading matches...
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
        p.matchId === currentMatchId