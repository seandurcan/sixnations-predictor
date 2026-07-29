"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type SortOption =
  | "points"
  | "difference"
  | "exact"
  | "error"
  | "player";

type LeaderboardEntry = {
  id: number;
  rank: number;
  firstName: string | null;
  lastName: string | null;
  totalPoints: number;
  differenceScore: number;
  exactScores: number;
  cumulativeError: number;
  previousRank: number | null;
  rankMovement: number | null;
};

type LeaderboardResponse = {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: LeaderboardEntry[];
  success?: boolean;
  error?: string;
};

const PAGE_SIZE = 10;

function getPlayerName(
  player: LeaderboardEntry
) {
  const fullName = [
    player.firstName,
    player.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unknown Player";
}

function getRankMedal(rank: number) {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "";
  }
}

function getRowClasses(rank: number) {
  switch (rank) {
    case 1:
      return "bg-yellow-50";
    case 2:
      return "bg-slate-50";
    case 3:
      return "bg-orange-50";
    default:
      return "";
  }
}

function getSortIndicator(
  selectedSort: SortOption,
  column: SortOption
) {
  if (selectedSort !== column) {
    return "";
  }

  switch (column) {
    case "player":
    case "difference":
    case "error":
      return " ▲";

    case "points":
    case "exact":
      return " ▼";

    default:
      return "";
  }
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>([]);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [
    totalRecords,
    setTotalRecords,
  ] = useState(0);

  const [sortBy, setSortBy] =
    useState<SortOption>("points");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/leaderboard?page=${page}&pageSize=${PAGE_SIZE}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as
            LeaderboardResponse;

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load the leaderboard."
          );
        }

        if (!Array.isArray(result.data)) {
          throw new Error(
            "The leaderboard returned invalid data."
          );
        }

        const returnedTotalPages =
          Math.max(
            1,
            Number(
              result.totalPages ?? 1
            )
          );

        setLeaderboard(result.data);

        setTotalPages(
          returnedTotalPages
        );

        setTotalRecords(
          Number(
            result.totalRecords ??
              result.data.length
          )
        );

        /*
         * If records were removed while the user
         * was viewing the final page, return them
         * to the highest available page.
         */
        if (page > returnedTotalPages) {
          setPage(returnedTotalPages);
        }
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Unable to load leaderboard:",
          loadError
        );

        setLeaderboard([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load the leaderboard."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      controller.abort();
    };
  }, [page]);

  const sortedLeaderboard =
    useMemo(() => {
      const data = [
        ...leaderboard,
      ];

      data.sort((a, b) => {
        switch (sortBy) {
          case "player":
            return (
              getPlayerName(a).localeCompare(
                getPlayerName(b),
                "en",
                {
                  sensitivity: "base",
                }
              ) || a.rank - b.rank
            );

          case "points":
            return (
              b.totalPoints -
                a.totalPoints ||
              a.rank - b.rank
            );

          case "difference":
            return (
              a.differenceScore -
                b.differenceScore ||
              a.rank - b.rank
            );

          case "exact":
            return (
              b.exactScores -
                a.exactScores ||
              a.rank - b.rank
            );

          case "error":
            return (
              a.cumulativeError -
                b.cumulativeError ||
              a.rank - b.rank
            );

          default:
            return a.rank - b.rank;
        }
      });

      return data;
    }, [leaderboard, sortBy]);

  function renderRankMovement(
    player: LeaderboardEntry
  ) {
    const movement =
      player.rankMovement;

    if (
      movement === undefined ||
      movement === null
    ) {
      return (
        <span
          className="text-slate-400"
          title="No previous ranking"
        >
          —
        </span>
      );
    }

    if (movement > 0) {
      return (
        <span
          className="font-semibold text-green-600"
          title={`Moved up ${movement} place${
            movement === 1 ? "" : "s"
          }`}
        >
          ↑ {movement}
        </span>
      );
    }

    if (movement < 0) {
      const places =
        Math.abs(movement);

      return (
        <span
          className="font-semibold text-red-600"
          title={`Moved down ${places} place${
            places === 1 ? "" : "s"
          }`}
        >
          ↓ {places}
        </span>
      );
    }

    return (
      <span
        className="text-slate-500"
        title="Rank unchanged"
      >
        →
      </span>
    );
  }

  function handleSortChange(
    value: string
  ) {
    setSortBy(value as SortOption);
  }

  return (
    <main className="p-8">
      <PageHeader
        title="Leaderboard"
        subtitle="Current tournament standings"
      />

      <p className="mb-6 text-slate-500">
        Total Players: {totalRecords}
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label
          htmlFor="leaderboard-sort"
          className="font-semibold text-slate-700"
        >
          Sort By
        </label>

        <Select
          id="leaderboard-sort"
          value={sortBy}
          onChange={(event) =>
            handleSortChange(
              event.target.value
            )
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
        </Select>
      </div>

      <Card title="Leaderboard">
        {loading && (
          <div
            className="py-12 text-center text-slate-500"
            role="status"
          >
            Loading leaderboard...
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          sortedLeaderboard.length ===
            0 && (
            <div className="py-12 text-center text-slate-500">
              No leaderboard entries are
              available.
            </div>
          )}

        {!loading &&
          !error &&
          sortedLeaderboard.length >
            0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100">
                    <th
                      scope="col"
                      className="border border-slate-200 p-3"
                    >
                      Rank
                    </th>

                    <th
                      scope="col"
                      className="border border-slate-200 p-3"
                    >
                      Last Change
                    </th>

                    <th
                      scope="col"
                      className="border border-slate-200 p-0"
                    >
                      <button
                        type="button"
                        className="w-full p-3 transition-colors hover:bg-slate-50"
                        onClick={() =>
                          setSortBy(
                            "player"
                          )
                        }
                      >
                        Player
                        {getSortIndicator(
                          sortBy,
                          "player"
                        )}
                      </button>
                    </th>

                    <th
                      scope="col"
                      className="border border-slate-200 p-0"
                    >
                      <button
                        type="button"
                        className="w-full p-3 transition-colors hover:bg-slate-50"
                        onClick={() =>
                          setSortBy(
                            "points"
                          )
                        }
                      >
                        Points
                        {getSortIndicator(
                          sortBy,
                          "points"
                        )}
                      </button>
                    </th>

                    <th
                      scope="col"
                      className="border border-slate-200 p-0"
                    >
                      <button
                        type="button"
                        className="w-full p-3 transition-colors hover:bg-slate-50"
                        onClick={() =>
                          setSortBy(
                            "difference"
                          )
                        }
                      >
                        Difference Score
                        {getSortIndicator(
                          sortBy,
                          "difference"
                        )}
                      </button>
                    </th>

                    <th
                      scope="col"
                      className="border border-slate-200 p-0"
                    >
                      <button
                        type="button"
                        className="w-full p-3 transition-colors hover:bg-slate-50"
                        onClick={() =>
                          setSortBy(
                            "exact"
                          )
                        }
                      >
                        Exact Scores
                        {getSortIndicator(
                          sortBy,
                          "exact"
                        )}
                      </button>
                    </th>

                    <th
                      scope="col"
                      className="border border-slate-200 p-0"
                    >
                      <button
                        type="button"
                        className="w-full p-3 transition-colors hover:bg-slate-50"
                        onClick={() =>
                          setSortBy(
                            "error"
                          )
                        }
                      >
                        Cumulative Error
                        {getSortIndicator(
                          sortBy,
                          "error"
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedLeaderboard.map(
                    (player) => (
                      <tr
                        key={player.id}
                        className={`text-center ${getRowClasses(
                          player.rank
                        )}`}
                      >
                        <td className="border border-slate-200 p-3 font-semibold">
                          {getRankMedal(
                            player.rank
                          )}{" "}
                          {player.rank}
                        </td>

                        <td className="border border-slate-200 p-3">
                          {renderRankMovement(
                            player
                          )}
                        </td>

                        <td className="border border-slate-200 p-3">
                          {getPlayerName(
                            player
                          )}
                        </td>

                        <td className="border border-slate-200 p-3 font-bold">
                          {
                            player.totalPoints
                          }
                        </td>

                        <td className="border border-slate-200 p-3">
                          {
                            player.differenceScore
                          }
                        </td>

                        <td className="border border-slate-200 p-3">
                          {
                            player.exactScores
                          }
                        </td>

                        <td className="border border-slate-200 p-3">
                          {
                            player.cumulativeError
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {!loading && !error && (
        <>
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing{" "}
            {sortedLeaderboard.length} of{" "}
            {totalRecords} players
            {" • "}
            Page {page} of {totalPages}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              disabled={
                page <= 1 || loading
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    1,
                    current - 1
                  )
                )
              }
            >
              Previous
            </Button>

            <span className="text-sm font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="secondary"
              disabled={
                page >= totalPages ||
                loading
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1
                  )
                )
              }
            >
              Next
            </Button>
          </div>
        </>
      )}
    </main>
  );
}