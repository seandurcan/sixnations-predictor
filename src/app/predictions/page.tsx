"use client";

import { useEffect, useState } from "react";

export default function PredictionsPage() {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    const response = await fetch("/api/matches");
    const data = await response.json();

    setMatches(data);
  }

  async function savePrediction() {
    if (matches.length === 0) return;

    const userId = localStorage.getItem("userId");

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: Number(userId),
        matchId: matches[currentMatchIndex].id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
      }),
    });

    const result = await response.json();

    if (result.success) {
      setHomeScore("");
      setAwayScore("");

      if (currentMatchIndex < matches.length - 1) {
        setCurrentMatchIndex(currentMatchIndex + 1);
      } else {
        alert("All predictions completed");
      }
    }
  }

  if (matches.length === 0) {
    return <div className="p-8">Loading matches...</div>;
  }

  const currentMatch = matches[currentMatchIndex];

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Predictions
      </h1>

      <p className="mb-4">
        Match {currentMatchIndex + 1} of {matches.length}
      </p>

      <div className="max-w-md border rounded p-6 space-y-4">
        <h2 className="text-xl font-bold">
          {currentMatch.homeTeam.name} vs{" "}
          {currentMatch.awayTeam.name}
        </h2>

        <input
          type="number"
          placeholder={`${currentMatch.homeTeam.name} Score`}
          className="border p-2 w-full"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
        />

        <input
          type="number"
          placeholder={`${currentMatch.awayTeam.name} Score`}
          className="border p-2 w-full"
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
        />

        <button
          onClick={savePrediction}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save & Next
        </button>
      </div>
    </main>
  );
}