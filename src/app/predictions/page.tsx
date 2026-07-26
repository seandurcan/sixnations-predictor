"use client";

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

      <h1 className="text-4xl font-bold mb-2">
        Predictions
      </h1>

      <p className="mb-6">
        Welcome{" "}
        <strong>
          {user?.firstName}
        </strong>
      </p>

      <p className="mb-4">
        Completed:{" "}
        {savedPredictions.length}
        {" / "}
        {matches.length}
      </p>

      {editing && (
        <div className="mb-4 p-3 bg-yellow-100 rounded">
          Editing Prediction
        </div>
      )}

      {lockMessage && (
        <div className="mb-4 p-4 rounded border border-red-500 bg-red-100">

          <div className="font-bold text-red-700">
            🔒 Prediction Locked
          </div>

          <div className="mt-2 text-red-700">
            {lockMessage}
          </div>

        </div>
      )}

      {isLocked &&
        existingPrediction && (
          <div className="mb-4 border rounded p-4 bg-gray-50">

            <h3 className="font-bold mb-2">
              Your Existing Prediction
            </h3>

            <p>
              {
                existingPrediction.predictedHomeScore
              }
              {" - "}
              {
                existingPrediction.predictedAwayScore
              }
            </p>

          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2">

        <div className="border rounded p-6 space-y-4">

          <h2 className="text-xl font-bold">
            {currentMatch.homeTeam.name}
            {" vs "}
            {currentMatch.awayTeam.name}
          </h2>

          <input
            type="number"
            disabled={isLocked}
            className="border p-2 w-full disabled:bg-gray-100 disabled:text-gray-500"
            placeholder={`${currentMatch.homeTeam.name} Score`}
            value={homeScore}
            onChange={(e) =>
              setHomeScore(
                e.target.value
              )
            }
          />

          <input
            type="number"
            disabled={isLocked}
            className="border p-2 w-full disabled:bg-gray-100 disabled:text-gray-500"
            placeholder={`${currentMatch.awayTeam.name} Score`}
            value={awayScore}
            onChange={(e) =>
              setAwayScore(
                e.target.value
              )
            }
          />

          <button
            disabled={isLocked}
            onClick={
              savePrediction
            }
            className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Prediction
          </button>

        </div>

        <div className="border rounded p-6">

          <h2 className="font-bold mb-4">
            Your Predictions
          </h2>

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

        </div>

      </div>

    </main>
  );
}