export const SIX_NATIONS_TEAM_NAMES = [
  "England",
  "France",
  "Ireland",
  "Italy",
  "Scotland",
  "Wales",
] as const;

export type SixNationsTeamName = (typeof SIX_NATIONS_TEAM_NAMES)[number];

export type FixtureImportInput = {
  providerGameId?: number | null;
  kickoffTime?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
};

export type PreparedFixture = {
  providerGameId: number | null;
  kickoffTime: Date;
  homeTeam: SixNationsTeamName;
  awayTeam: SixNationsTeamName;
  venue: string;
  city: string | null;
  country: string | null;
  round: number;
  matchNumber: number;
};

function cleanOptionalText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maximumLength);
}

function canonicalTeam(value: unknown): SixNationsTeamName | null {
  if (typeof value !== "string") return null;
  return SIX_NATIONS_TEAM_NAMES.find((team) => team === value) ?? null;
}

export function prepareFixtureImport(
  fixtures: FixtureImportInput[],
  competitionYear: number
): { fixtures: PreparedFixture[]; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(fixtures) || fixtures.length !== 15) {
    return {
      fixtures: [],
      errors: [`Exactly 15 fixtures are required; received ${Array.isArray(fixtures) ? fixtures.length : 0}.`],
    };
  }

  const parsed = fixtures.map((fixture, index) => {
    const homeTeam = canonicalTeam(fixture.homeTeam);
    const awayTeam = canonicalTeam(fixture.awayTeam);
    const kickoffTime = new Date(String(fixture.kickoffTime ?? ""));
    const venue = cleanOptionalText(fixture.venue, 160);

    if (!homeTeam) errors.push(`Fixture ${index + 1} has an invalid home team.`);
    if (!awayTeam) errors.push(`Fixture ${index + 1} has an invalid away team.`);
    if (homeTeam && awayTeam && homeTeam === awayTeam) {
      errors.push(`Fixture ${index + 1} cannot have the same home and away team.`);
    }
    if (Number.isNaN(kickoffTime.getTime())) {
      errors.push(`Fixture ${index + 1} needs a valid kickoff time.`);
    } else if (kickoffTime.getUTCFullYear() !== competitionYear) {
      errors.push(`Fixture ${index + 1} kickoff must be in ${competitionYear}.`);
    }
    if (!venue) errors.push(`Fixture ${index + 1} needs a stadium.`);

    return {
      providerGameId:
        Number.isInteger(fixture.providerGameId) && Number(fixture.providerGameId) > 0
          ? Number(fixture.providerGameId)
          : null,
      kickoffTime,
      homeTeam,
      awayTeam,
      venue,
      city: cleanOptionalText(fixture.city, 120),
      country: cleanOptionalText(fixture.country, 120),
    };
  });

  if (errors.length > 0) return { fixtures: [], errors };

  const recognised = parsed as Array<{
    providerGameId: number | null;
    kickoffTime: Date;
    homeTeam: SixNationsTeamName;
    awayTeam: SixNationsTeamName;
    venue: string;
    city: string | null;
    country: string | null;
  }>;
  const pairings = recognised.map((fixture) =>
    [fixture.homeTeam, fixture.awayTeam].sort().join("|")
  );
  if (new Set(pairings).size !== pairings.length) {
    errors.push("Each pair of teams must meet exactly once; duplicate pairings were found.");
  }

  for (const team of SIX_NATIONS_TEAM_NAMES) {
    const appearances = recognised.filter(
      (fixture) => fixture.homeTeam === team || fixture.awayTeam === team
    ).length;
    if (appearances !== 5) {
      errors.push(`${team} must appear in exactly 5 fixtures; found ${appearances}.`);
    }
  }

  if (errors.length > 0) return { fixtures: [], errors };

  const ordered = [...recognised].sort(
    (a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime()
  );
  return {
    errors: [],
    fixtures: ordered.map((fixture, index) => ({
      ...fixture,
      matchNumber: index + 1,
      round: Math.floor(index / 3) + 1,
    })),
  };
}

