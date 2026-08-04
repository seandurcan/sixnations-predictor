"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CountdownTimer from "@/components/ui/CountdownTimer";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
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

      const sortedUpcomingMatches =
        [...upcomingMatches].sort(
          (a: any, b: any) =>
            new Date(
              a.kickoffTime
            ).getTime() -
            new Date(
              b.kickoffTime
            ).getTime()
        );

      if (
        sortedUpcomingMatches.length > 0
      ) {
        setNextMatch(
          sortedUpcomingMatches[0]
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

  function getWelcomeSubtitle() {
    if (!userRow) {
      return `Welcome ${
        user?.firstName ?? "Player"
      }`;
    }

    return `Welcome ${
      user?.firstName ?? "Player"
    } · Ranked #${userRow.rank ?? "-"} of ${
      leaderboard.length
    } players`;
  }

  if (loading) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageContainer>
          <PageHeader
            title="Dashboard"
            subtitle="Loading your dashboard..."
          />

          <Card>
            Loading dashboard...
          </Card>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Dashboard"
          subtitle={getWelcomeSubtitle()}
        />

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <Button
            fullWidth
            onClick={() => {
              window.location.href =
                "/predictions";
            }}
          >
            Make Predictions
          </Button>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              window.location.href =
                "/leaderboard";
            }}
          >
            View Leaderboard
          </Button>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              window.location.href =
                "/";
            }}
          >
            View Fixtures
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Rank"
            value={
              lastMatch
                ? `#${userRow?.rank ?? "-"}`
                : "-"
            }
            tone="navy"
          />

          <StatCard
            title="Rank Movement"
            value={renderMovement()}
            tone={
              userRow?.rankMovement > 0
                ? "lime"
                : userRow?.rankMovement < 0
                  ? "orange"
                  : "navy"
            }
          />

          <StatCard
            title="Total Points"
            value={
              userRow?.totalPoints ?? 0
            }
            tone="blue"
          />

          <StatCard
            title="Difference Score"
            value={
              userRow?.differenceScore ?? 0
            }
            tone="navy"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Exact Scores"
            value={
              userRow?.exactScores ?? 0
            }
            tone="lime"
          />

          <StatCard
            title="Prediction Progress"
            value={`${predictionCount} / ${matchCount}`}
            tone="orange"
          />

          <StatCard
            title="Players"
            value={leaderboard.length}
            tone="blue"
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Next Match">
            {nextMatch ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-semibold text-[var(--brand-navy)]">
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

                  <p className="mt-2 text-[var(--brand-muted)]">
                    Round{" "}
                    {nextMatch.round}
                  </p>

                  <p className="font-semibold text-[var(--brand-blue)]">
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

                <Button
                  fullWidth
                  onClick={() => {
                    window.location.href =
                      "/predictions";
                  }}
                >
                  Predict This Match
                </Button>
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
                <p className="text-xl font-semibold text-[var(--brand-navy)]">
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
                  <div className="mt-4 space-y-2 text-[var(--brand-muted)]">
                    <p>
                      Points Earned:{" "}
                      <span className="font-semibold text-[var(--brand-blue)]">
                        {
                          lastPrediction.pointsAwarded
                        }
                      </span>
                    </p>

                    <p>
                      Difference Score:{" "}
                      <span className="font-semibold text-[var(--brand-orange)]">
                        {
                          lastPrediction.differenceScore
                        }
                      </span>
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
      </PageContainer>
    </main>
  );
}