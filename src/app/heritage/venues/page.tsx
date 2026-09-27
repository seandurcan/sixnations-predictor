import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { championshipVenues, venuesSource } from "@/lib/heritage";

export const metadata: Metadata = { title: "Championship Venues | Perfect XV", description: "Visit the grounds that give the tournament its sense of place. Learn where each nation plays and how the stadiums and their surroundings form part of the Championship experience." };

export default function Page() {
  
  return <HeritageSection slug="venues"><Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {championshipVenues.map((venue) => (
                <article
                  key={venue.stadium}
                  className="rounded-xl border border-[var(--brand-border)] bg-slate-50 p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                    {venue.nation}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{venue.stadium}</h3>
                  <p className="text-sm font-semibold">{venue.city}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">
                    {venue.note}
                  </p>
                </article>
              ))}
            </div>
            <a
              href={venuesSource}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-sm font-semibold text-[var(--brand-blue)] underline"
            >
              Official 2027 Championship venues
            </a>
          </Card></HeritageSection>;
}
