"use client";

import { useEffect, useMemo, useState } from "react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] =
    useState<any[]>([]);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [sortBy, setSortBy] =
    useState("points");

  const pageSize = 10;

  useEffect(() => {
    loadLeaderboard(page);
  }, [page]);

  async function loadLeaderboard(
    pageNumber: number
  ) {
    const response = await fetch(
      `/api/leaderboard?page=${pageNumber}&pageSize=${pageSize}`
    );

    const result =
      await response.json();

    setLeaderboard(result.data);
    setTotalPages(result.totalPages);
  }

  const sortedLeaderboard =
    useMemo(() => {
      const data = [...leaderboard];

      switch (sortBy) {
        case "player":
          return data.sort((a, b) =>
            `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            )
          );

        case "points":
          return data.sort(
            (a, b) =>
              b.totalPoints -
              a.totalPoints
          );

        case "difference":
          return data.sort(
            (a, b) =>
              a.differenceScore -
              b.differenceScore
          );

        case "exact":
          return data.sort(
            (a, b) =>
              b.exactScores -
              a.exactScores
          );

        case "error":
          return data.sort(
            (a, b) =>
              a.cumulativeError -
              b.cumulativeError
          );

        default:
          return data;
      }
    }, [leaderboard, sortBy]);

  function renderRankMovement(
    user: any
  ) {
    if (
      user.rankMovement === undefined ||
      user.rankMovement === null
    ) {
      return "-";
    }

    if (user.rankMovement > 0) {
      return `↑ ${user.rankMovement}`;
    }

    if (user.rankMovement < 0) {
      return `↓ ${Math.abs(
        user.rankMovement
      )}`;
    }

    return "→";
  }

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-6">
        Leaderboard
      </h1>

      <div className="mb-6 flex items-center gap-4">

        <label className="font-semibold">
          Sort By
        </label>

        <select
          className="border p-2 rounded"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
          }
        >
          <option value="points">
            Total Points
          </option>

          <option value="difference">
            Difference Score
          </option>

          <option value="exact">
            Exact Scores
          </option>

          <option value="error">
            Cumulative Error
          </option>

          <option value="player">
            Player Name
          </option>
        </select>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-100">

              <th className="border p-3">
                Rank
              </th>

              <th className="border p-3">
                Last Change
              </th>

              <th className="border p-3">
                Player
              </th>

              <th className="border p-3">
                Points
              </th>

              <th className="border p-3">
                Difference Score
              </th>

              <th className="border p-3">
                Exact Scores
              </th>

              <th className="border p-3">
                Error
              </th>

            </tr>

          </thead>

          <tbody>

            {sortedLeaderboard.map(
              (user) => (
                <tr
                  key={user.id}
                  className="text-center"
                >

                  <td className="border p-3">
                    {user.rank}
                  </td>

                  <td className="border p-3">
                    {renderRankMovement(
                      user
                    )}
                  </td>

                  <td className="border p-3">
                    {user.firstName}
                    {" "}
                    {user.lastName}
                  </td>

                  <td className="border p-3 font-bold">
                    {user.totalPoints}
                  </td>

                  <td className="border p-3">
                    {user.differenceScore}
                  </td>

                  <td className="border p-3">
                    {user.exactScores}
                  </td>

                  <td className="border p-3">
                    {user.cumulativeError}
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

      <div className="flex items-center justify-center gap-4 mt-6">

        <button
          disabled={page === 1}
          onClick={() =>
            setPage(page - 1)
          }
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={
            page === totalPages
          }
          onClick={() =>
            setPage(page + 1)
          }
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </main>
  );
}