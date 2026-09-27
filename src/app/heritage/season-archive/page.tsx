import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { historicSeasons } from "@/lib/heritage";

export const metadata: Metadata = { title: "Historic Tables & Season Stories | Perfect XV", description: "Put the final standings beside the story of the season. Open a selected Championship to see its table, winning team and the events that turned a promising campaign into a title." };

export default function Page() {
  
  return <HeritageSection slug="season-archive"><Card>
            <p className="mb-6 leading-7 text-[var(--brand-muted)]">
              Selected modern Championships, with the final table alongside the story of how the title was won.
            </p>

            <div className="space-y-5">
              {[...historicSeasons]
                .sort((a, b) => b.year - a.year)
                .map((season) => (
                <details
                  key={season.year}
                  className="rounded-xl border border-[var(--brand-border)] bg-white"
                >
                  <summary className="cursor-pointer px-5 py-4 font-bold">
                    {season.year} — {season.champion}
                  </summary>
                  <div className="border-t border-[var(--brand-border)] p-5">
                    <p className="mb-5 leading-7 text-[var(--brand-muted)]">
                      {season.story}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-200 p-2 text-left">Pos</th>
                            <th className="border border-slate-200 p-2 text-left">Team</th>
                            <th className="border border-slate-200 p-2 text-right">P</th>
                            <th className="border border-slate-200 p-2 text-right">W</th>
                            <th className="border border-slate-200 p-2 text-right">D</th>
                            <th className="border border-slate-200 p-2 text-right">L</th>
                            <th className="border border-slate-200 p-2 text-right">PD</th>
                            <th className="border border-slate-200 p-2 text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {season.standings.map((row) => (
                            <tr key={row.team}>
                              <td className="border border-slate-200 p-2 font-bold">{row.position}</td>
                              <td className="border border-slate-200 p-2">{row.team}</td>
                              <td className="border border-slate-200 p-2 text-right">{row.played}</td>
                              <td className="border border-slate-200 p-2 text-right">{row.won}</td>
                              <td className="border border-slate-200 p-2 text-right">{row.drawn}</td>
                              <td className="border border-slate-200 p-2 text-right">{row.lost}</td>
                              <td className="border border-slate-200 p-2 text-right">{row.pointsDifference > 0 ? `+${row.pointsDifference}` : row.pointsDifference}</td>
                              <td className="border border-slate-200 p-2 text-right font-bold">{row.tablePoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <a
                      href={season.source}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block text-sm font-semibold text-[var(--brand-blue)] underline"
                    >
                      Season source
                    </a>
                  </div>
                </details>
              ))}
            </div>
          </Card></HeritageSection>;
}
