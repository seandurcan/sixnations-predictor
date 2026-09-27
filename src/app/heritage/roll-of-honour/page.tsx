import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import HeritageSection from "@/components/heritage/HeritageSection";
import { sixNationsWinners } from "@/lib/heritage";

export const metadata: Metadata = { title: "Six Nations Roll of Honour | Perfect XV", description: "Every champion of the Six Nations era, from the first tournament in 2000 onwards. Trace the balance of power across generations and revisit the seasons when each nation took the title." };

export default function Page() {
  
  return <HeritageSection slug="roll-of-honour"><Card>
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
          </Card></HeritageSection>;
}
