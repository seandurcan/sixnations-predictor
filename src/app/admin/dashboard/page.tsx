"use client";

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        Failed to load dashboard.
      </div>
    );
  }

  const metrics =
    data.metrics;

  return (
    <main className="min-h-screen bg-slate-50 p-8 space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Tournament overview and administration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-sm font-medium text-slate-500">
            Registered Users
          </h2>

          <p className="text-4xl font-bold mt-3">
            {metrics.userCount}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-sm font-medium text-slate-500">
            Verified Users
          </h2>

          <p className="text-4xl font-bold mt-3">
            {metrics.verifiedUserCount}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-sm font-medium text-slate-500">
            Predictions
          </h2>

          <p className="text-4xl font-bold mt-3">
            {metrics.predictionCount}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-sm font-medium text-slate-500">
            Fixtures Complete
          </h2>

          <p className="text-4xl font-bold mt-3">
            {metrics.completedFixtures}
          </p>

          <p className="text-slate-500 mt-1">
            of {metrics.totalFixtures}
          </p>
        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="bg-white rounded-xl shadow-sm border p-6">

          <h2 className="text-2xl font-bold mb-4">
            Tournament Status
          </h2>

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

              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                  data.tournament?.status ===
                  "OPEN"
                    ? "bg-green-100 text-green-700"
                    : data.tournament?.status ===
                        "LOCKED"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {
                  data.tournament
                    ?.status
                }
              </span>

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

        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">

          <h2 className="text-2xl font-bold mb-4">
            Current Leader
          </h2>

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

        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="bg-white rounded-xl shadow-sm border p-6">

          <h2 className="text-2xl font-bold mb-4">
            Top 10 Leaderboard
          </h2>

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

        </div>

        {data.winner ? (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">

            <h2 className="text-2xl font-bold mb-4">
              Tournament Winner
            </h2>

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

          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-6">

            <h2 className="text-2xl font-bold mb-4">
              Tournament Winner
            </h2>

            <p>
              Tournament not yet completed.
            </p>

          </div>
        )}

      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">

        <h2 className="text-2xl font-bold mb-4">
          Recent Audit Activity
        </h2>

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
                    {new Date(
                      audit.createdAt
                    ).toLocaleString()}
                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </main>
  );
}