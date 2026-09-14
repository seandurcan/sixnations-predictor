"use client";

import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { formatIrishDate } from "@/lib/formatIrishDate";
import { useCallback, useEffect, useMemo, useState } from "react";

type Team = { name: string; shortCode: string };
type Fixture = {
  id: number;
  matchNumber: number;
  round: number;
  kickoffTime: string;
  venue: string;
  city?: string | null;
  country?: string | null;
  referee?: string | null;
  completed: boolean;
  actualHomeScore?: number | null;
  actualAwayScore?: number | null;
  homeTeam: Team;
  awayTeam: Team;
  liveStatus?: string | null;
};

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFixtures = useCallback(async () => {
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load fixtures.");
      const data = (await response.json()) as Fixture[];
      setFixtures([...data].sort((a,b) => a.matchNumber - b.matchNumber));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load fixtures.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFixtures();
    const timer = window.setInterval(() => void loadFixtures(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadFixtures]);

  const fixturesByWeek = useMemo(
    () => fixtures.reduce<Record<number, Fixture[]>>((weeks, fixture) => {
      if (!weeks[fixture.round]) weeks[fixture.round] = [];
      weeks[fixture.round].push(fixture);
      return weeks;
    }, {}),
    [fixtures]
  );

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Fixtures"
          subtitle="Six Nations Championship 2027"
          className="mb-6"
        />

        {loading && <Card>Loading fixtures...</Card>}
        {!loading && error && (
          <Card className="border-red-300 bg-red-50 text-red-700">{error}</Card>
        )}
        {!loading && !error && fixtures.length === 0 && (
          <Card>No fixtures are currently available.</Card>
        )}

        {!loading && !error && fixtures.length > 0 && (
          <div className="space-y-6">
            {Object.entries(fixturesByWeek)
              .sort(([a],[b]) => Number(a) - Number(b))
              .map(([week, weekFixtures]) => (
                <section
                  key={week}
                  className="rounded-xl border border-[var(--brand-border)] p-4"
                >
                  <h2 className="mb-4 text-xl font-bold">Week {week}</h2>
                  <div className="space-y-4">
                    {weekFixtures.map((fixture) => {
                      const location = [fixture.venue, fixture.city, fixture.country]
                        .filter(Boolean).join(", ");
                      const hasScore =
                        fixture.actualHomeScore != null &&
                        fixture.actualAwayScore != null;

                      return (
                        <Card key={fixture.id}>
                          <p className="mb-2 text-sm font-semibold text-[var(--brand-blue)]">
                            Match {fixture.matchNumber} · Round {fixture.round}
                          </p>
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-[minmax(220px,1fr)_220px_minmax(320px,1.35fr)] md:items-center md:gap-6">
                              <div className="text-xl font-bold">
                                {fixture.homeTeam.name} v {fixture.awayTeam.name}
                              </div>
                              <div className="text-[var(--brand-muted)]">
                                {formatIrishDate(fixture.kickoffTime)}
                              </div>
                              <div className="text-[var(--brand-muted)]">
                                {location}
                              </div>
                            </div>

                            {hasScore && (
                              <div className="min-w-32 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] px-4 py-3 text-center">
                                <p className="text-2xl font-black">
                                  {fixture.actualHomeScore} – {fixture.actualAwayScore}
                                </p>
                                <p className="text-xs font-semibold uppercase text-[var(--brand-muted)]">
                                  {fixture.completed
                                    ? "Full time"
                                    : fixture.liveStatus ?? "Live"}
                                </p>
                              </div>
                            )}
                          </div>

                          {fixture.referee && (
                            <p className="mt-2 text-sm text-[var(--brand-muted)]">
                              Referee: {fixture.referee}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        )}
      </PageContainer>
    </main>
  );
}
