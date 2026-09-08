"use client";

import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { formatIrishDate } from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

type Team = {
  name: string;
  shortCode: string;
};

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
};

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFixtures() {
      try {
        const response = await fetch("/api/matches");

        if (!response.ok) {
          throw new Error("Unable to load fixtures.");
        }

        const data = (await response.json()) as Fixture[];
        setFixtures(
          [...data].sort((a, b) => a.matchNumber - b.matchNumber)
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load fixtures."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadFixtures();
  }, []);

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
          <Card className="border-red-300 bg-red-50 text-red-700">
            {error}
          </Card>
        )}

        {!loading && !error && fixtures.length === 0 && (
          <Card>No fixtures are currently available.</Card>
        )}

        {!loading && !error && fixtures.length > 0 && (
          <div className="space-y-4">
            {fixtures.map((fixture) => {
              const location = [fixture.venue, fixture.city, fixture.country]
                .filter(Boolean)
                .join(", ");
              const hasResult =
                fixture.completed &&
                fixture.actualHomeScore != null &&
                fixture.actualAwayScore != null;

              return (
                <Card key={fixture.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-blue)]">
                        Match {fixture.matchNumber} · Round {fixture.round}
                      </p>
                      <h2 className="mt-1 text-xl font-bold">
                        {fixture.homeTeam.name} v {fixture.awayTeam.name}
                      </h2>
                      <p className="mt-2 text-[var(--brand-muted)]">
                        {formatIrishDate(fixture.kickoffTime)}
                      </p>
                      <p className="mt-1 text-[var(--brand-muted)]">
                        {location}
                      </p>
                      {fixture.referee && (
                        <p className="mt-1 text-sm text-[var(--brand-muted)]">
                          Referee: {fixture.referee}
                        </p>
                      )}
                    </div>

                    <div className="min-w-32 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] px-4 py-3 text-center">
                      {hasResult ? (
                        <>
                          <p className="text-2xl font-black">
                            {fixture.actualHomeScore} – {fixture.actualAwayScore}
                          </p>
                          <p className="text-xs font-semibold uppercase text-[var(--brand-muted)]">
                            Full time
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold">
                            {fixture.homeTeam.shortCode} v {fixture.awayTeam.shortCode}
                          </p>
                          <p className="text-xs font-semibold uppercase text-[var(--brand-muted)]">
                            Scheduled
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </main>
  );
}
