"use client";

import Card from "@/components/ui/Card";
import CountdownTimer from "@/components/ui/CountdownTimer";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  formatIrishDate,
  formatIsoDate,
} from "@/lib/formatIrishDate";
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

      setMatchCount(matches.length);

      const upcomingMatches =
        matches.filter(
          (m: any) => !m.completed
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
          (m: any) => m.completed
        );

      if (
        completedMatches.length > 0
      ) {
        setLastMatch(
          completedMatches[
            completedMatches.length - 1
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

      if (predictions.length > 0) {
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
      console.error(
        "Dashboard load failed:",
        {
          timestamp:
            formatIsoDate(
              new Date()
            ),
          error,
        }
      );

      window.location.href =
        "/login";
    }
  }

  function renderMovement() {
    if (!userRow) return "-";

    if (
      userRow.rankMovement ===
        undefined ||
      userRow.rankMovement === null
    ) {
      return "-";
    }

    if (userRow.rankMovement > 0) {
      return `↑ ${userRow.rankMovement}`;
    }

    if (userRow.rankMovement < 0) {
      return `↓ ${Math.abs(
        userRow.rankMovement
      )}`;
    }

    return "→";
  }

  if (loading) {
    return (
      <main className="p-8">
        <PageHeader
          title="Dashboard"
          subtitle="Loading your dashboard..."
        />

        <Card>
          Loading dashboard...
        </Card>
      </main>
    );
  }

  return (
    <main className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome ${user?.firstName ?? "Player"}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Rank"
          value={`#${userRow?.rank ?? "-"}`}
        />

        <StatCard
          title="Rank Movement"
          value={renderMovement()}
        />

        <StatCard
          title="Total Points"
          value={
            userRow?.totalPoints ?? 0
          }
        />

        <StatCard
          title="Difference Score"
          value={
            userRow?.differenceScore ?? 0
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <StatCard
          title="Exact Scores"
          value={
            userRow?.exactScores ?? 0
          }
        />

        <StatCard
          title="Prediction Progress"
          value={`${predictionCount} / ${matchCount}`}
        />

        <StatCard
          title="Players"
          value={leaderboard.length}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card title="Next Match">
          {nextMatch ? (
            <div className="space-y-4">
              <div>
                <p className="text-xl font-semibold">
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
                  Round{" "}
                  {nextMatch.round}
                </p>

                <p className="text-slate-600">
                  {formatIrishDate(
                    nextMatch.kickoffTime
                  )}
                </p>
              </div>

              <CountdownTimer
                targetDate={
                  nextMatch.kickoffTime
                }
                label="Time until kick-off"
              />
            </div>
          ) : (
            <p>
              Tournament Complete
            </p>
          )}
        </Card>

        <Card title="Latest Result">
          {lastMatch ? (
            <>
              <p className="text-xl font-semibold">
                {
                  lastMatch.homeTeam
                    .name
                }{" "}
                {
                  lastMatch.actualHomeScore
                }
                {" - "}
                {
                  lastMatch.actualAwayScore
                }{" "}
                {
                  lastMatch.awayTeam
                    .name
                }
              </p>

              {lastPrediction && (
                <div className="mt-4">
                  <p>
                    Points Earned:{" "}
                    {
                      lastPrediction.pointsAwarded
                    }
                  </p>

                  <p>
                    Difference Score:{" "}
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
        </Card>
      </div>
    </main>
  );
}