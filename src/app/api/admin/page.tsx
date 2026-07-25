"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] =
    useState<number | null>(null);

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    const response = await fetch(
      "/api/admin/matches"
    );

    const data = await response.json();

    setMatches(data);

    if (data.length > 0) {
      setSelectedMatchId(data[0].id);
    }
  }

  async function saveResult() {
    if (!selectedMatchId) return;

    const response = await fetch(
      "/api/admin/results",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          matchId: selectedMatchId,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      }
    );

    const result =
      await response.json();

    if (result.success) {
      alert("Result saved");

      setHomeScore("");
      setAwayScore("");

      loadMatches();
    }
  }

  const selectedMatch =
    matches.find(
      (m) => m.id === selectedMatchId
    );

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Admin Results Entry
      </h1>

      <div className="max-w-lg space-y-4">

        <select
          className="border p-2 w-full"
          value={selectedMatchId ?? ""}
          onChange={(e) =>
            setSelectedMatchId(
              Number(e.target.value)
            )
          }
        >
          {matches.map((match) => (
            <option
              key={match.id}
              value={match.id}
            >
              Round {match.round} -
              {" "}
              {match.homeTeam.name}
              {" vs "}
              {match.awayTeam.name}
            </option>
          ))}
        </select>

        {selectedMatch && (
          <>
            <h2 className="text-xl font-bold">
              {selectedMatch.homeTeam.name}
              {" vs "}
              {selectedMatch.awayTeam.name}
            </h2>

            <input
              type="number"
              placeholder={`${selectedMatch.homeTeam.name} Score`}
              className="border p-2 w-full"
              value={homeScore}
              onChange={(e) =>
                setHomeScore(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder={`${selectedMatch.awayTeam.name} Score`}
              className="border p-2 w-full"
              value={awayScore}
              onChange={(e) =>
                setAwayScore(
                  e.target.value
                )
              }
            />

            <button
              onClick={saveResult}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Result
            </button>
          </>
        )}

      </div>
    </main>
  );
}