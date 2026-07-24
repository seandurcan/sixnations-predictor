"use client";

import { useState } from "react";

export default function PredictionsPage() {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  async function savePrediction() {
    const userId = localStorage.getItem("userId");

    const response = await fetch(
      "/api/predictions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number(userId),
          matchId: 1,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      }
    );

    const result = await response.json();

    alert(JSON.stringify(result));
  }

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Predictions
      </h1>

      <div className="max-w-md border rounded p-6 space-y-4">

        <h2 className="text-xl font-bold">
          Ireland vs France
        </h2>

        <input
          type="number"
          placeholder="Ireland Score"
          className="border p-2 w-full"
          value={homeScore}
          onChange={(e) =>
            setHomeScore(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="France Score"
          className="border p-2 w-full"
          value={awayScore}
          onChange={(e) =>
            setAwayScore(e.target.value)
          }
        />

        <button
          onClick={savePrediction}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save Prediction
        </button>

      </div>
    </main>
  );
}