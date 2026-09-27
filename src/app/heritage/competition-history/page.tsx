import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";

import { prisma } from "@/lib/prisma";
import { assignCompetitionRanks } from "@/lib/scoring";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Perfect XV Competition History | Perfect XV", description: "Our own roll of honour grows here. Browse completed Perfect XV competitions, their winners and full final standings, including points, exact scores and Prediction Delta." };
async function loadPerfectXvHistory() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ["COMPLETED", "ARCHIVED"] },
    },
    orderBy: [{ year: "desc" }, { id: "desc" }],
    include: {
      entries: {
        where: { status: "ENTERED" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              deletedAt: true,
              predictions: {
                where: {
                  match: {
                    completed: true,
                  },
                },
                select: {
                  match: { select: { tournamentId: true } },
                  pointsAwarded: true,
                  errorValue: true,
                  exactScore: true,
                  correctMargin: true,
                  correctResult: true,
                  differenceScore: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return tournaments.map((tournament) => {
    const rows = tournament.entries
      .filter((entry) => !entry.user.deletedAt)
      .map((entry) => {
        const predictions = entry.user.predictions.filter(
          (prediction) => prediction.match.tournamentId === tournament.id
        );

        return {
          id: entry.user.id,
          firstName: entry.user.firstName,
          lastName: entry.user.lastName,
          totalPoints: predictions.reduce(
            (sum, prediction) => sum + Number(prediction.pointsAwarded),
            0
          ),
          cumulativeError: predictions.reduce(
            (sum, prediction) => sum + prediction.errorValue,
            0
          ),
          exactScores: predictions.filter((prediction) => prediction.exactScore).length,
          correctMargins: predictions.filter((prediction) => prediction.correctMargin).length,
          correctResults: predictions.filter((prediction) => prediction.correctResult).length,
          differenceScore: predictions.reduce(
            (sum, prediction) => sum + prediction.differenceScore,
            0
          ),
        };
      });

    return {
      id: tournament.id,
      year: tournament.year,
      name: tournament.name,
      standings: assignCompetitionRanks(rows),
    };
  });
}

function playerName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown Player";
}


export default async function Page() {
  const perfectXvHistory = await loadPerfectXvHistory();
  return <HeritageSection slug="competition-history"><Card>
            {perfectXvHistory.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="font-semibold">The archive begins with the first completed Perfect XV competition.</p>
                <p className="mt-2 text-sm text-[var(--brand-muted)]">
                  Completed competitions will automatically appear here with their full final standings, so the Perfect XV record grows year by year.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {perfectXvHistory.map((competition) => (
                  <details
                    key={competition.id}
                    className="rounded-xl border border-[var(--brand-border)] bg-white"
                  >
                    <summary className="cursor-pointer px-5 py-4 font-bold">
                      {competition.name} {competition.year}
                      {competition.standings[0]
                        ? ` — Winner: ${playerName(
                            competition.standings[0].firstName,
                            competition.standings[0].lastName
                          )}`
                        : ""}
                    </summary>
                    <div className="border-t border-[var(--brand-border)] p-5">
                      {competition.standings.length === 0 ? (
                        <p className="text-[var(--brand-muted)]">
                          No final entrant standings are available for this competition.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-200 p-2 text-left">Rank</th>
                                <th className="border border-slate-200 p-2 text-left">Entrant</th>
                                <th className="border border-slate-200 p-2 text-right">Points</th>
                                <th className="border border-slate-200 p-2 text-right">Correct Results</th>
                                <th className="border border-slate-200 p-2 text-right">Exact Scores</th>
                                <th className="border border-slate-200 p-2 text-right">Correct Margins</th>
                                <th className="border border-slate-200 p-2 text-right">Aggregate Error</th>
                                <th className="border border-slate-200 p-2 text-right">Prediction Delta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {competition.standings.map((entrant) => (
                                <tr key={entrant.id}>
                                  <td className="border border-slate-200 p-2 font-bold">{entrant.rank}</td>
                                  <td className="border border-slate-200 p-2">
                                    {playerName(entrant.firstName, entrant.lastName)}
                                  </td>
                                  <td className="border border-slate-200 p-2 text-right font-bold">{entrant.totalPoints}</td>
                                  <td className="border border-slate-200 p-2 text-right">{entrant.correctResults}</td>
                                  <td className="border border-slate-200 p-2 text-right">{entrant.exactScores}</td>
                                  <td className="border border-slate-200 p-2 text-right">{entrant.correctMargins}</td>
                                  <td className="border border-slate-200 p-2 text-right">{entrant.cumulativeError}</td>
                                  <td className="border border-slate-200 p-2 text-right">{entrant.differenceScore}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </Card></HeritageSection>;
}
