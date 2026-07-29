"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
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
      <PageHeader
        title="Leaderboard"
        subtitle="Current tournament standings"
      />

      <p className="mb-6 text-slate-500">
        Total Players: {leaderboard.length}
      </p>

      <div className="mb-6 flex items-center gap-4">
        <label className="font-semibold">
          Sort By
        </label>

        <Select
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
            Points Differential
          </option>

          <option value="player">
            Player Name
          </option>
        </Select>
      </div>

      <Card title="Leaderboard">
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

                <th
                  className="border p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setSortBy("player")
                  }
                >
                  Player{" "}
                  {sortBy ===
                    "player" && "↓"}
                </th>

                <th
                  className="border p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setSortBy("points")
                  }
                >
                  Points{" "}
                  {sortBy ===
                    "points" && "↓"}
                </th>

                <th
                  className="border p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setSortBy(
                      "difference"
                    )
                  }
                >
                  Difference Score{" "}
                  {sortBy ===
                    "difference" &&
                    "↓"}
                </th>

                <th
                  className="border p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setSortBy("exact")
                  }
                >
                  Exact Scores{" "}
                  {sortBy ===
                    "exact" && "↓"}
                </th>

                <th
                  className="border p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setSortBy("error")
                  }
                >
                  Points Differential{" "}
                  {sortBy ===
                    "error" && "↓"}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedLeaderboard.map(
                (user, index) => (
                  <tr
                    key={user.id}
                    className={`text-center ${
                      index === 0
                        ? "bg-yellow-50"
                        : index === 1
                        ? "bg-slate-50"
                        : index === 2
                        ? "bg-orange-50"
                        : ""
                    }`}
                  >
                    <td className="border p-3">
                      {index === 0 &&
                        "🥇 "}
                      {index === 1 &&
                        "🥈 "}
                      {index === 2 &&
                        "🥉 "}
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
      </Card>

      <div className="mt-6 text-center text-sm text-slate-500">
        Showing {sortedLeaderboard.length} players
        {" • "}
        Total Players: {leaderboard.length}
        {" • "}
        Page {page} of {totalPages}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="secondary"
          disabled={page === 1}
          onClick={() =>
            setPage(page - 1)
          }
        >
          Previous
        </Button>

        <span>
          Page {page} of {totalPages}
        </span>

        <Button
          variant="secondary"
          disabled={
            page === totalPages
          }
          onClick={() =>
            setPage(page + 1)
          }
        >
          Next
        </Button>
      </div>
    </main>
  );
}