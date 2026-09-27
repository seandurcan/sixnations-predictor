import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";
import { assignCompetitionRanks } from "@/lib/scoring";
import {
  championshipEras,
  classicMatches,
  heritageSources,
  sixNationsWinners,
} from "@/lib/heritage";

export const dynamic = "force-dynamic";

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

function playerName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown Player";
}

export default async function HeritagePage() {
  const perfectXvHistory = await loadPerfectXvHistory();

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Heritage & History"
          subtitle="The story of the Championship, its great matches, its champions, and the growing history of Perfect XV."
        />

        <div className="space-y-10">
          <Card title="From Home Nations to Six Nations">
            <p className="mb-6 leading-7 text-[var(--brand-muted)]">
              The Championship dates to 1883. It has survived two world wars, expanded from four nations to five and then six, and developed into one of rugby union&apos;s defining annual competitions.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {championshipEras.map((era) => (
                <div
                  key={era.years}
                  className="rounded-xl border border-[var(--brand-border)] bg-slate-50 p-5"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                    {era.years}
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{era.title}</h3>
                  <p className="mt-3 leading-7 text-[var(--brand-muted)]">
                    {era.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Six Nations Roll of Honour">
            <p className="mb-5 text-[var(--brand-muted)]">
              Champions since Italy joined and the modern Six Nations era began in 2000.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {sixNationsWinners.map((winner) => (
                <div
                  key={winner.year}
                  className="flex items-center justify-between rounded-lg border border-[var(--brand-border)] px-4 py-3"
                >
                  <span className="font-bold">{winner.year}</span>
                  <span>{winner.champion}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Classic Championship Matches">
            <div className="space-y-5">
              {classicMatches.map((match) => (
                <article
                  key={`${match.year}-${match.title}`}
                  className="rounded-xl border border-[var(--brand-border)] p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-orange)]">
                        {match.year}
                      </p>
                      <h3 className="text-xl font-bold">{match.title}</h3>
                      <p className="mt-1 font-semibold">{match.score}</p>
                    </div>
                    <p className="text-sm text-[var(--brand-muted)]">{match.venue}</p>
                  </div>
                  <p className="mt-4 leading-7 text-[var(--brand-muted)]">
                    {match.story}
                  </p>
                </article>
              ))}
            </div>
          </Card>

          <Card title="Perfect XV Competition History">
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
          </Card>

          <Card title="Where this section goes next">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-bold">Team Histories & Great Players</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
                  Championship stories for Ireland, England, France, Scotland, Wales and Italy, followed by profiles of the players who shaped different eras.
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-bold">Records, Venues & Deeper Archive</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
                  Grand Slams, Triple Crowns, scoring and appearance records, famous grounds, full historic tables and a growing archive of classic matches.
                </p>
              </div>
            </div>
          </Card>

          <div className="text-sm text-[var(--brand-muted)]">
            <p className="font-semibold text-[var(--brand-navy)]">Historical sources</p>
            <div className="mt-2 flex flex-col gap-2">
              {heritageSources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-[var(--brand-blue)]"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
