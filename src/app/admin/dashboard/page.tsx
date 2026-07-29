"use client";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatIrishDate, formatIsoDate } from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response =
        await fetch(
          "/api/admin/dashboard"
        );

      if (response.status === 401) {
        window.location.href =
          "/login";
        return;
      }

      if (response.status === 403) {
        window.location.href =
          "/dashboard";
        return;
      }

      const result =
        await response.json();

      setData(result);
    } catch (error) {
      console.error(
        "Admin dashboard load failed:",
        {
          timestamp: formatIsoDate(
            new Date()
          ),
          error,
        }
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Loading tournament overview..."
        />

        <Card>
          Loading dashboard...
        </Card>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Tournament overview and administration"
        />

        <Card>
          Failed to load dashboard.
        </Card>
      </main>
    );
  }

  const metrics =
    data.metrics;

  return (
    <main className="min-h-screen bg-slate-50 p-8 space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Tournament overview and administration"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Registered Users"
          value={metrics.userCount}
        />

        <StatCard
          title="Verified Users"
          value={metrics.verifiedUserCount}
        />

        <StatCard
          title="Predictions"
          value={metrics.predictionCount}
        />

        <StatCard
          title="Fixtures Complete"
          value={metrics.completedFixtures}
          subtitle={`of ${metrics.totalFixtures}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Tournament Status">
          <div className="space-y-3">
            <p>
              <strong>Name:</strong>{" "}
              {data.tournament?.name}
            </p>

            <p>
              <strong>Year:</strong>{" "}
              {data.tournament?.year}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <StatusBadge
                status={
                  data.tournament
                    ?.status
                }
              />
            </p>

            <p>
              <strong>
                Remaining Fixtures:
              </strong>{" "}
              {
                metrics.remainingFixtures
              }
            </p>
          </div>
        </Card>

        <Card title="Current Leader">
          {data.currentLeader ? (
            <>
              <p className="text-2xl font-semibold">
                {
                  data.currentLeader
                    .firstName
                }{" "}
                {
                  data.currentLeader
                    .lastName
                }
              </p>

              <p className="mt-3">
                Points:{" "}
                <strong>
                  {
                    data.currentLeader
                      .totalPoints
                  }
                </strong>
              </p>

              <p>
                Exact Scores:{" "}
                <strong>
                  {
                    data.currentLeader
                      .exactScores
                  }
                </strong>
              </p>
            </>
          ) : (
            <p>
              No leaderboard data available.
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top 10 Leaderboard">
          {data.leaderboard?.length >
          0 ? (
            <div className="space-y-3">
              {data.leaderboard.map(
                (
                  user: any,
                  index: number
                ) => (
                  <div
                    key={
                      user.id
                    }
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <span className="font-semibold">
                        #
                        {index +
                          1}
                      </span>
                      {" "}
                      {
                        user.firstName
                      }
                      {" "}
                      {
                        user.lastName
                      }
                    </div>

                    <div className="font-bold">
                      {
                        user.totalPoints
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p>
              No leaderboard data available.
            </p>
          )}
        </Card>

        {data.winner ? (
          <Card
            title="Tournament Winner"
            className="bg-green-50 border-green-200"
          >
            <p className="text-xl font-semibold">
              {
                data.winner.user
                  ?.firstName
              }{" "}
              {
                data.winner.user
                  ?.lastName
              }
            </p>

            <p className="mt-2">
              Final Points:{" "}
              <strong>
                {
                  data.winner
                    .finalPoints
                }
              </strong>
            </p>
          </Card>
        ) : (
          <Card title="Tournament Winner">
            <p>
              Tournament not yet completed.
            </p>
          </Card>
        )}
      </div>

      <Card title="Recent Audit Activity">
        {data.recentAudits?.length ===
        0 ? (
          <p>
            No audit activity found.
          </p>
        ) : (
          <div className="space-y-4">
            {data.recentAudits.map(
              (audit: any) => (
                <div
                  key={audit.id}
                  className="border-b pb-4"
                >
                  <div className="font-semibold">
                    {audit.match
                      ? `${audit.match.homeTeam.shortCode} v ${audit.match.awayTeam.shortCode}`
                      : `Match ${audit.matchId}`}
                  </div>

                  <div className="mt-1">
                    {
                      audit.previousHome ??
                      "-"
                    }
                    {" - "}
                    {
                      audit.previousAway ??
                      "-"
                    }
                    {" → "}
                    {
                      audit.newHome
                    }
                    {" - "}
                    {
                      audit.newAway
                    }
                  </div>

                  <div className="text-sm text-slate-500 mt-1">
                    Changed by{" "}
                    {audit.adminUser
                      ? `${audit.adminUser.firstName} ${audit.adminUser.lastName}`
                      : `Admin ${audit.adminUserId}`}
                  </div>

                  <div className="text-sm text-slate-400">
                    {formatIrishDate(
                      audit.createdAt
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>
    </main>
  );
}