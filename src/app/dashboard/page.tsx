"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] =
    useState<any>(null);

  const [leaderboard, setLeaderboard] =
    useState<any[]>([]);

  const [userRow, setUserRow] =
    useState<any>(null);

  const [nextMatch, setNextMatch] =
    useState<any>(null);

  const [predictionCount, setPredictionCount] =
    useState(0);

  const [matchCount, setMatchCount] =
    useState(0);

  const [lastMatch, setLastMatch] =
    useState<any>(null);

  const [lastPrediction, setLastPrediction] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

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

      setUser(me.user);

      const leaderboardResponse =
        await fetch(
          "/api/leaderboard?page=1&pageSize=500"
        );

      const leaderboardData =
        await leaderboardResponse.json();

      const leaderboardRows =
        leaderboardData.data ?? [];

      setLeaderboard(
        leaderboardRows
      );

      const currentUser =
        leaderboardRows.find(
          (u: any) =>
            u.id === me.user.id
        );

      setUserRow(currentUser);

      const matchesResponse =
        await fetch("/api/matches");

      const matches =
        await matchesResponse.json();

      setMatchCount(
        matches.length
      );

      const upcomingMatches =
        matches.filter(
          (m: any) =>
            !m.completed
        );

      if (
        upcomingMatches.length > 0
      ) {
        setNextMatch(
          upcomingMatches[0]
        );
      }

      const completedMatches =
        matches.filter(
          (m: any) =>
            m.completed
        );

      if (
        completedMatches.length > 0
      ) {
        setLastMatch(
          completedMatches[
            completedMatches.length -
              1
          ]
        );
      }

      const predictionsResponse =
        await fetch(
          "/api/predictions/list"
        );

      const predictions =
        await predictionsResponse.json();

      setPredictionCount(
        predictions.length
      );

      if (
        predictions.length > 0
      ) {
        const sortedPredictions =
          [...predictions].sort(
            (a, b) =>
              new Date(
                b.updatedAt
              ).getTime() -
              new Date(
                a.updatedAt
              ).getTime()
          );

        setLastPrediction(
          sortedPredictions[0]
        );
      }

      setLoading(false);
    } catch (error) {
      console.error(error);

      window.location.href =
        "/login";
    }
  }

  function renderMovement() {
    if (!userRow) return "-";

    if (
      userRow.rankMovement ===
        undefined ||
      userRow.rankMovement ===
        null
    ) {
      return "-";
    }

    if (
      userRow.rankMovement > 0
    ) {
      return `↑ ${userRow.rankMovement}`;
    }

    if (
      userRow.rankMovement < 0
    ) {
      return `↓ ${Math.abs(
        userRow.rankMovement
      )}`;
    }

    return "→";
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-2">
        Dashboard
      </h1>

      <p className="text-xl mb-8">
        Welcome{" "}
        <strong>
          {user?.firstName ??
            "Player"}
        </strong>
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Current Rank
          </h2>

          <p className="text-3xl">
            #{userRow?.rank ?? "-"}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Rank Movement
          </h2>

          <p className="text-3xl">
            {renderMovement()}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Total Points
          </h2>

          <p className="text-3xl">
            {userRow?.totalPoints ??
              0}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Difference Score
          </h2>

          <p className="text-3xl">
            {userRow?.differenceScore ??
              0}
          </p>
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Exact Scores
          </h2>

          <p className="text-2xl">
            {userRow?.exactScores ??
              0}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Prediction Progress
          </h2>

          <p className="text-2xl">
            {predictionCount}
            {" / "}
            {matchCount}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Players
          </h2>

          <p className="text-2xl">
            {leaderboard.length}
          </p>
        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">

        <div className="border rounded p-6">

          <h2 className="text-2xl font-bold mb-4">
            Next Match
          </h2>

          {nextMatch ? (
            <>
              <p className="text-xl">
                {
                  nextMatch.homeTeam
                    .name
                }
                {" vs "}
                {
                  nextMatch.awayTeam
                    .name
                }
              </p>

              <p className="mt-2">
                Round {nextMatch.round}
              </p>

              <p>
                {
                  nextMatch.kickoffTime
                }
              </p>
            </>
          ) : (
            <p>
              Tournament Complete
            </p>
          )}

        </div>

        <div className="border rounded p-6">

          <h2 className="text-2xl font-bold mb-4">
            Latest Result
          </h2>

          {lastMatch ? (
            <>
              <p className="text-xl">
                {
                  lastMatch.homeTeam
                    .name
                }
                {" "}
                {
                  lastMatch.actualHomeScore
                }
                {" - "}
                {
                  lastMatch.actualAwayScore
                }
                {" "}
                {
                  lastMatch.awayTeam
                    .name
                }
              </p>

              {lastPrediction && (
                <div className="mt-4">

                  <p>
                    Points Earned:
                    {" "}
                    {
                      lastPrediction.pointsAwarded
                    }
                  </p>

                  <p>
                    Difference Score:
                    {" "}
                    {
                      lastPrediction.differenceScore
                    }
                  </p>

                </div>
              )}

            </>
          ) : (
            <p>
              No completed matches
            </p>
          )}

        </div>

      </div>

    </main>
  );
}
