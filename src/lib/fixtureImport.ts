import {
  isCrossYearCompetition,
  isSixNationsCompetition,
  SIX_NATIONS_TEAMS,
} from "@/lib/fixtureDiscovery";

export const SIX_NATIONS_TEAM_NAMES = SIX_NATIONS_TEAMS;
export type SixNationsTeamName = (typeof SIX_NATIONS_TEAM_NAMES)[number];

export type FixtureImportInput = {
  providerGameId?: number | null;
  round?: number | null;
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
  homeTeam: string;
  awayTeam: string;
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

function cleanTeam(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, 120) : null;
}

function yearAllowed(kickoffTime: Date, competitionYear: number, competitionName: string) {
  const kickoffYear = kickoffTime.getUTCFullYear();
  return isCrossYearCompetition(competitionName)
    ? kickoffYear === competitionYear || kickoffYear === competitionYear + 1
    : kickoffYear === competitionYear;
}

export function prepareCompetitionFixtureImport(
  fixtures: FixtureImportInput[],
  competition: { year: number; name: string }
): { fixtures: PreparedFixture[]; errors: string[] } {
  const errors: string[] = [];
  const sixNations = isSixNationsCompetition(competition.name);

  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    return { fixtures: [], errors: ["At least one fixture is required."] };
  }
  if (sixNations && fixtures.length !== 15) {
    return {
      fixtures: [],
      errors: [`Exactly 15 fixtures are required for the Six Nations; received ${fixtures.length}.`],
    };
  }

  const parsed = fixtures.map((fixture, index) => {
    const homeTeam = cleanTeam(fixture.homeTeam);
    const awayTeam = cleanTeam(fixture.awayTeam);
    const kickoffTime = new Date(String(fixture.kickoffTime ?? ""));
    const venue = cleanOptionalText(fixture.venue, 160);
    const suppliedRound =
      Number.isInteger(fixture.round) && Number(fixture.round) > 0
        ? Number(fixture.round)
        : null;

    if (!homeTeam) errors.push(`Fixture ${index + 1} has an invalid home team.`);
    if (!awayTeam) errors.push(`Fixture ${index + 1} has an invalid away team.`);
    if (homeTeam && awayTeam && homeTeam === awayTeam) {
      errors.push(`Fixture ${index + 1} cannot have the same home and away team.`);
    }
    if (Number.isNaN(kickoffTime.getTime())) {
      errors.push(`Fixture ${index + 1} needs a valid kickoff time.`);
    } else if (!yearAllowed(kickoffTime, competition.year, competition.name)) {
      const expected = isCrossYearCompetition(competition.name)
        ? `${competition.year} or ${competition.year + 1}`
        : String(competition.year);
      errors.push(`Fixture ${index + 1} kickoff must be in ${expected}.`);
    }
    if (!venue) errors.push(`Fixture ${index + 1} needs a stadium.`);

    return {
      providerGameId:
        Number.isInteger(fixture.providerGameId) && Number(fixture.providerGameId) > 0
          ? Number(fixture.providerGameId)
          : null,
      suppliedRound,
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
    suppliedRound: number | null;
    kickoffTime: Date;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    city: string | null;
    country: string | null;
  }>;

  const exactKeys = recognised.map(
    (fixture) =>
      `${fixture.homeTeam}|${fixture.awayTeam}|${fixture.kickoffTime.toISOString()}`
  );
  if (new Set(exactKeys).size !== exactKeys.length) {
    errors.push("Duplicate fixture records were found.");
  }

  if (sixNations) {
    const pairings = recognised.map((fixture) =>
      [fixture.homeTeam, fixture.awayTeam].sort().join("|")
    );
    if (new Set(pairings).size !== pairings.length) {
      errors.push("Each Six Nations pair of teams must meet exactly once.");
    }
    for (const team of SIX_NATIONS_TEAM_NAMES) {
      const appearances = recognised.filter(
        (fixture) => fixture.homeTeam === team || fixture.awayTeam === team
      ).length;
      if (appearances !== 5) {
        errors.push(`${team} must appear in exactly 5 fixtures; found ${appearances}.`);
      }
    }
  }

  if (errors.length > 0) return { fixtures: [], errors };

  const ordered = [...recognised].sort(
    (a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime()
  );

  let inferredRound = 1;
  let previousDate = "";
  return {
    errors: [],
    fixtures: ordered.map((fixture, index) => {
      const dateKey = fixture.kickoffTime.toISOString().slice(0, 10);
      if (!sixNations && index > 0 && dateKey !== previousDate && fixture.suppliedRound === null) {
        inferredRound += 1;
      }
      previousDate = dateKey;

      return {
        providerGameId: fixture.providerGameId,
        kickoffTime: fixture.kickoffTime,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        venue: fixture.venue,
        city: fixture.city,
        country: fixture.country,
        matchNumber: index + 1,
        round: fixture.suppliedRound ?? (sixNations ? Math.floor(index / 3) + 1 : inferredRound),
      };
    }),
  };
}

// Backwards-compatible Six Nations helper used by existing tests.
export function prepareFixtureImport(
  fixtures: FixtureImportInput[],
  competitionYear: number
) {
  return prepareCompetitionFixtureImport(fixtures, {
    year: competitionYear,
    name: "Six Nations Championship",
  });
}
