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
    void initialise();
  }, []);

  async function initialise() {
    try {
      const meResponse =
        await fetch("/api/auth/me", {
          cache: "no-store",
        });

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
          "/api/leaderboard?page=1&pageSize=500",
          {
            cache: "no-store",
          }
        );

      if (!leaderboardResponse.ok) {
        throw new Error(
          "Unable to load leaderboard data."
        );
      }

      const leaderboardData =
        await leaderboardResponse.json();

      const leaderboardRows =
        leaderboardData.data ?? [];

      setLeaderboard(
        leaderboardRows
      );

      const currentUser =
        leaderboardRows.find(
          (entrant: any) =>
            entrant.id === me.user.id
        );

      setUserRow(
        currentUser ?? null
      );

      const matchesResponse =
        await fetch("/api/matches", {
          cache: "no-store",
        });

      if (!matchesResponse.ok) {
        throw new Error(
          "Unable to load fixtures."
        );
      }

      const matches =
        await matchesResponse.json();

      setMatchCount(
        matches.length
      );

      const upcomingMatches =
        matches
          .filter(
            (match: any) =>
              !match.completed
          )
          .sort(
            (a: any, b: any) =>
              new Date(
                a.kickoffTime
              ).getTime() -
              new Date(
                b.kickoffTime
              ).getTime()
          );

      setNextMatch(
        upcomingMatches[0] ??
          null
      );

      const completedMatches =
        matches
          .filter(
            (match: any) =>
              match.completed &&
              match.actualHomeScore !== null &&
              match.actualHomeScore !== undefined &&
              match.actualAwayScore !== null &&
              match.actualAwayScore !== undefined
          )
          .sort(
            (a: any, b: any) =>
              new Date(
                a.kickoffTime
              ).getTime() -
              new Date(
                b.kickoffTime
              ).getTime()
          );

      const latestCompletedMatch =
        completedMatches.length > 0
          ? completedMatches[
              completedMatches.length - 1
            ]
          : null;

      setLastMatch(
        latestCompletedMatch
      );

      const predictionsResponse =
        await fetch(
          "/api/predictions/list",
          {
            cache: "no-store",
          }
        );

      if (!predictionsResponse.ok) {
        throw new Error(
          "Unable to load predictions."
        );
      }

      const predictions =
        await predictionsResponse.json();

      setPredictionCount(
        predictions.length
      );

      const latestMatchPrediction =
        latestCompletedMatch
          ? predictions.find(
              (prediction: any) =>
                prediction.matchId ===
                latestCompletedMatch.id
            )
          : null;

      setLastPrediction(
        latestMatchPrediction ??
          null
      );

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
    if (!userRow) {
      return "-";
    }

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

  function getWelcomeSubtitle() {
    if (!userRow) {
      return `Welcome ${
        user?.firstName ?? "Player"
      }`;
    }

    return `Welcome ${
      user?.firstName ?? "Player"
    } · Ranked #${
      userRow.rank ?? "-"
    } of ${
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
                "/fixtures";
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
                ? `#${
                    userRow?.rank ??
                    "-"
                  }`
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
            title="Prediction Progress"
            value={`${predictionCount} / ${matchCount}`}
            tone="orange"
          />

          <StatCard
            title="Players"
            value={
              leaderboard.length
            }
            tone="blue"
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-[var(--brand-navy)]">
            Your Scoring Position
          </h2>

          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            Leaderboard ranking is applied from left to right.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Points"
              value={
                userRow?.totalPoints ??
                0
              }
              tone="blue"
            />

            <StatCard
              title="Correct Results"
              value={
                userRow?.correctResults ??
                0
              }
              tone="navy"
            />

            <StatCard
              title="Exact Scores"
              value={
                userRow?.exactScores ??
                0
              }
              tone="lime"
            />

            <StatCard
              title="Correct Winning Margins"
              value={
                userRow?.correctMargins ??
                0
              }
              tone="orange"
            />

            <StatCard
              title="Aggregate Score Error"
              value={
                userRow?.cumulativeError ??
                0
              }
              tone="navy"
            />
          </div>

          <p className="mt-3 text-sm text-[var(--brand-muted)]">
            Total Points → Correct Results → Exact Scores → Correct Winning Margins → Lowest Aggregate Score Error
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Next Match">
            {nextMatch ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-semibold text-[var(--brand-navy)]">
                    {
                      nextMatch
                        .homeTeam.name
                    }
                    {" vs "}
                    {
                      nextMatch
                        .awayTeam.name
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
                    lastMatch
                      .homeTeam.name
                  }{" "}
                  {
                    lastMatch
                      .actualHomeScore
                  }
                  {" - "}
                  {
                    lastMatch
                      .actualAwayScore
                  }{" "}
                  {
                    lastMatch
                      .awayTeam.name
                  }
                </p>

                {lastPrediction ? (
                  <div className="mt-4 space-y-2 text-[var(--brand-muted)]">
                    <p>
                      Your Prediction:{" "}
                      <span className="font-semibold text-[var(--brand-navy)]">
                        {
                          lastPrediction
                            .predictedHomeScore
                        }
                        {" - "}
                        {
                          lastPrediction
                            .predictedAwayScore
                        }
                      </span>
                    </p>

                    <p>
                      Points Earned:{" "}
                      <span className="font-semibold text-[var(--brand-blue)]">
                        {
                          lastPrediction
                            .pointsAwarded
                        }
                      </span>
                    </p>

                    <p>
                      Score Error:{" "}
                      <span className="font-semibold text-[var(--brand-orange)]">
                        {
                          lastPrediction
                            .errorValue
                        }
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-[var(--brand-muted)]">
                    No prediction was recorded for this match.
                  </p>
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
