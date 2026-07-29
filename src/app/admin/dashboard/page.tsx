"use client";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  formatIrishDate,
  formatIsoDate,
} from "@/lib/formatIrishDate";
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
          timestamp:
            formatIsoDate(
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
      <main className="min-h-screen bg-white p-8 text-[var(--brand-navy)]">
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
      <main className="min-h-screen bg-white p-8 text-[var(--brand-navy)]">
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
    <main className="min-h-screen bg-white p-8 text-[var(--brand-navy)]">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Tournament overview and administration"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Registered Users"
          value={metrics.userCount}
          tone="blue"
        />

        <StatCard
          title="Verified Users"
          value={metrics.verifiedUserCount}
          tone="lime"
        />

        <StatCard
          title="Predictions"
          value={metrics.predictionCount}
          tone="orange"
        />

        <StatCard
          title="Fixtures Complete"
          value={metrics.completedFixtures}
          subtitle={`of ${metrics.totalFixtures}`}
          tone="navy"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Tournament Status">
          <div className="space-y-3 text-[var(--brand-muted)]">
            <p>
              <strong className="text-[var(--brand-navy)]">
                Name:
              </strong>{" "}
              {data.tournament?.name}
            </p>

            <p>
              <strong className="text-[var(--brand-navy)]">
                Year:
              </strong>{" "}
              {data.tournament?.year}
            </p>

            <p>
              <strong className="text-[var(--brand-navy)]">
                Status:
              </strong>{" "}
              <StatusBadge
                status={
                  data.tournament
                    ?.status
                }
              />
            </p>

            <p>
              <strong className="text-[var(--brand-navy)]">
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
              <p className="text-2xl font-semibold text-[var(--brand-navy)]">
                {
                  data.currentLeader
                    .firstName
                }{" "}
                {
                  data.currentLeader
                    .lastName
                }
              </p>

              <p className="mt-3 text-[var(--brand-muted)]">
                Points:{" "}
                <strong className="text-[var(--brand-blue)]">
                  {
                    data.currentLeader
                      .totalPoints
                  }
                </strong>
              </p>

              <p className="text-[var(--brand-muted)]">
                Exact Scores:{" "}
                <strong className="text-[var(--brand-navy)]">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
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
                    className="flex items-center justify-between border-b border-[var(--brand-border)] pb-2"
                  >
                    <div>
                      <span className="font-semibold text-[var(--brand-blue)]">
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

                    <div className="font-bold text-[var(--brand-navy)]">
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
            className="bg-[var(--brand-soft-lime)] border-[rgba(157,255,0,0.75)]"
          >
            <p className="text-xl font-semibold text-[var(--brand-navy)]">
              {
                data.winner.user
                  ?.firstName
              }{" "}
              {
                data.winner.user
                  ?.lastName
              }
            </p>

            <p className="mt-2 text-[var(--brand-muted)]">
              Final Points:{" "}
              <strong className="text-[var(--brand-blue)]">
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

      <div className="mt-8">
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
                    className="border-b border-[var(--brand-border)] pb-4"
                  >
                    <div className="font-semibold text-[var(--brand-navy)]">
                      {audit.match
                        ? `${audit.match.homeTeam.shortCode} v ${audit.match.awayTeam.shortCode}`
                        : `Match ${audit.matchId}`}
                    </div>

                    <div className="mt-1 text-[var(--brand-muted)]">
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
                      <span className="font-semibold text-[var(--brand-orange)]">
                        {
                          audit.newHome
                        }
                        {" - "}
                        {
                          audit.newAway
                        }
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-[var(--brand-muted)]">
                      Changed by{" "}
                      {audit.adminUser
                        ? `${audit.adminUser.firstName} ${audit.adminUser.lastName}`
                        : `Admin ${audit.adminUserId}`}
                    </div>

                    <div className="text-sm text-[var(--brand-blue)]">
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
      </div>
    </main>
  );
}