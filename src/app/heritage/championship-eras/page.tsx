import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { championshipEras } from "@/lib/heritage";

export const metadata: Metadata = { title: "From Home Nations to Six Nations | Perfect XV", description: "Follow the Championship from its four-nation beginnings in 1883 through the arrival of France and Italy. Explore the rivalries, interruptions and reinventions that shaped the tournament we know today." };

export default function Page() {
  
  return <HeritageSection slug="championship-eras"><Card>
            <p className="mb-6 leading-7 text-[var(--brand-muted)]">
              The Championship dates to 1883. It has survived two world wars, expanded from four nations to five and then six, and developed into one of rugby union&apos;s defining annual competitions.
            </p>

            <div className="space-y-8">
              {championshipEras.map((era) => (
                <div
                  key={era.years}
                  className="rounded-xl border border-[var(--brand-border)] bg-slate-50 p-5"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                    {era.years}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{era.title}</h2>
                  <div className="mt-4 space-y-4 text-[var(--brand-muted)]">
                    {era.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="leading-7">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card></HeritageSection>;
}
