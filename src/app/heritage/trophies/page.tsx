import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { rivalryTrophies, silverwareSource } from "@/lib/heritage";

export const metadata: Metadata = { title: "Trophies & Rivalries | Perfect XV", description: "There is more at stake than the Championship trophy. Discover the history of the Triple Crown and the rivalry trophies that give individual fixtures an extra layer of meaning." };

export default function Page() {
  
  return <HeritageSection slug="trophies"><Card>
            <p className="mb-6 leading-7 text-[var(--brand-muted)]">
              The Championship is layered with historic rivalry trophies as well as the main Six Nations title and the Triple Crown.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {rivalryTrophies.map((trophy) => (
                <article
                  key={trophy.name}
                  className="rounded-xl border border-[var(--brand-border)] p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-orange)]">
                    {trophy.fixture}
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{trophy.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
                    {trophy.story}
                  </p>
                </article>
              ))}
            </div>
            <a
              href={silverwareSource}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-sm font-semibold text-[var(--brand-blue)] underline"
            >
              Official guide to Six Nations silverware
            </a>
          </Card></HeritageSection>;
}
