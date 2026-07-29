"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
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
      console.error(error);

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

    setMatches(data);

    if (
      data.length > 0 &&
      !selectedMatchId
    ) {
      setSelectedMatchId(
        data[0].id
      );
    }
  }

  async function saveResult() {
    if (!selectedMatchId) {
      return;
    }

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
      alert(
        "Administrator access required."
      );

      window.location.href =
        "/dashboard";
      return;
    }

    const result =
      await response.json();

    if (result.success) {
      alert("Result saved");

      setHomeScore("");
      setAwayScore("");

      loadMatches();
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  if (!authorised) {
    return null;
  }

  const selectedMatch =
    matches.find(
      (m) =>
        m.id ===
        selectedMatchId
    );

  return (
    <main className="p-8">
      <PageHeader
        title="Admin Results Entry"
        subtitle="Manage match results and tournament scoring"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Fixtures">
          <div className="space-y-2 max-h-[700px] overflow-y-auto">
            {matches.map(
              (match) => (
                <div
                  key={match.id}
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
                  }}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-100 ${
                    selectedMatchId ===
                    match.id
                      ? "bg-blue-100 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="font-semibold">
                    R
                    {match.round}
                  </div>

                  <div>
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

                  {match.completed && (
                    <div className="text-green-600 text-sm">
                      Result Entered
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </Card>

        <Card
          title="Result Entry"
          className="md:col-span-2"
        >
          {selectedMatch && (
            <>
              <h2 className="text-2xl font-bold mb-6">
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

              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder={`${selectedMatch.homeTeam.name} Score`}
                  value={homeScore}
                  onChange={(e) =>
                    setHomeScore(
                      e.target.value
                    )
                  }
                />

                <Input
                  type="number"
                  placeholder={`${selectedMatch.awayTeam.name} Score`}
                  value={awayScore}
                  onChange={(e) =>
                    setAwayScore(
                      e.target.value
                    )
                  }
                />

                <Button
                  onClick={
                    saveResult
                  }
                >
                  Save Result
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}