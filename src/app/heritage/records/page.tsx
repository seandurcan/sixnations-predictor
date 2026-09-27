import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { heritageRecords } from "@/lib/heritage";

export const metadata: Metadata = { title: "Championship Records | Perfect XV", description: "Explore notable scoring and Championship records, with links to the underlying statistics. These are the benchmarks left behind by outstanding teams and individual performances." };

export default function Page() {
  
  return <HeritageSection slug="records"><Card>
            <div className="grid gap-4 md:grid-cols-2">
              {heritageRecords.map((record) => (
                <article
                  key={record.title}
                  className="rounded-xl border border-[var(--brand-border)] bg-slate-50 p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                    {record.title}
                  </p>
                  <p className="mt-2 text-2xl font-black">{record.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
                    {record.detail}
                  </p>
                  <a
                    href={record.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-[var(--brand-blue)] underline"
                  >
                    Official statistics
                  </a>
                </article>
              ))}
            </div>
          </Card></HeritageSection>;
}
