import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { teamHistories } from "@/lib/heritage";

export const metadata: Metadata = { title: "The Six Nations Teams | Perfect XV", description: "Six shirts, six traditions and six very different paths through the Championship. Discover each nation’s identity, landmark campaigns and place in a rivalry that has lasted for generations." };

export default function Page() {
  
  return <HeritageSection slug="teams"><Card>
            <p className="mb-6 leading-7 text-[var(--brand-muted)]">
              Six nations, six very different Championship stories. Each has its own traditions, rivalries, eras of success and players who shaped the tournament.
            </p>

            <div className="grid gap-5 lg:grid-cols-2">
              {teamHistories.map((team) => (
                <article
                  key={team.team}
                  className="rounded-xl border border-[var(--brand-border)] p-5"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                    {team.team}
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{team.heading}</h3>
                  <p className="mt-3 leading-7 text-[var(--brand-muted)]">
                    {team.story}
                  </p>

                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--brand-muted)]">
                    {team.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>

                  <a
                    href={team.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-[var(--brand-blue)] underline"
                  >
                    Official Six Nations team record
                  </a>
                </article>
              ))}
            </div>
          </Card></HeritageSection>;
}
