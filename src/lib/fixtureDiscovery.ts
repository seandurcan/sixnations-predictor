export const SIX_NATIONS_TEAMS = [
  "England",
  "France",
  "Ireland",
  "Italy",
  "Scotland",
  "Wales",
] as const;

type ApiLeague = {
  id?: number;
  name?: string;
  country?: { name?: string } | string;
  seasons?: Array<number | { season?: number; year?: number }>;
};

type ApiGame = {
  id?: number;
  date?: string;
  time?: string;
  timezone?: string;
  week?: string | number;
  round?: string | number;
  teams?: {
    home?: { name?: string };
    away?: { name?: string };
  };
  home?: string | { name?: string };
  away?: string | { name?: string };
  venue?: string | { name?: string; city?: string };
  city?: string;
  country?: string | { name?: string };
  league?: { id?: number; name?: string; country?: string | { name?: string } };
};

export type FixturePreview = {
  providerGameId: number | null;
  round: number | null;
  kickoffTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  providerHomeTeam: string;
  providerAwayTeam: string;
  venue: string | null;
  city: string | null;
  country: string | null;
};

export type FixturePreviewResult = {
  provider: "API-Sports" | "Official / Online";
  providerLeague: { id: number; name: string; seasons?: number[] };
  fixtures: FixturePreview[];
  participantTeams?: string[];
  warnings: string[];
  valid: boolean;
  expectedFixtureCount: number;
  discoveredFixtureCount: number;
  competitionKind?: "SIX_NATIONS" | "LEAGUE";
  queryDiagnostics?: string[];
};

export function normaliseCompetitionName(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

export function isSixNationsCompetition(name: string) {
  return normaliseCompetitionName(name).includes("sixnations");
}

export function isCrossYearCompetition(name: string) {
  const normalised = normaliseCompetitionName(name);
  return (
    normalised.includes("unitedrugbychampionship") ||
    normalised.includes("challengecup")
  );
}

export function providerCompetitionSearchName(name: string) {
  const normalised = normaliseCompetitionName(name);
  if (isSixNationsCompetition(name)) return "Six Nations";
  if (normalised.includes("unitedrugbychampionship")) {
    return "United Rugby Championship";
  }
  if (normalised.includes("rugbyworldcup")) {
    return "World Cup";
  }
  return name.trim();
}

function canonicalSixNationsTeam(value: unknown) {
  const candidate = normaliseCompetitionName(value);
  return SIX_NATIONS_TEAMS.find(
    (team) => normaliseCompetitionName(team) === candidate
  ) ?? null;
}

function teamName(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "").trim();
  }
  return "";
}

function textValue(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  }
  return null;
}

function roundNumber(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function kickoffIso(game: ApiGame) {
  if (!game.date) return null;
  const direct = new Date(game.date);
  if (!Number.isNaN(direct.getTime()) && /T|\s\d{1,2}:\d{2}/.test(game.date)) {
    return direct.toISOString();
  }
  if (!game.time) return null;
  if (game.timezone && !["UTC", "GMT"].includes(game.timezone.toUpperCase())) return null;
  const combined = new Date(`${game.date}T${game.time}:00Z`);
  return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
}

function seasonAvailable(league: ApiLeague, year: number) {
  if (!Array.isArray(league.seasons) || league.seasons.length === 0) return true;
  return league.seasons.some((season) =>
    typeof season === "number"
      ? season === year
      : season.season === year || season.year === year
  );
}

async function providerGet<T>(
  path: string,
  apiKey: string,
  diagnostics?: string[]
): Promise<T[]> {
  const response = await fetch(`https://v1.rugby.api-sports.io/${path}`, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`API-Sports returned HTTP ${response.status} for ${path}.`);
  }
  const payload = (await response.json()) as {
    response?: T[];
    errors?: unknown;
    results?: number;
  };

  const apiErrors =
    payload.errors && typeof payload.errors === "object"
      ? Object.entries(payload.errors as Record<string, unknown>)
          .filter(([, value]) => value !== null && value !== "" && value !== false)
          .map(([key, value]) => `${key}: ${String(value)}`)
      : [];

  if (apiErrors.length > 0) {
    throw new Error(
      `API-Sports error for ${path}: ${apiErrors.join("; ")}`
    );
  }

  if (!Array.isArray(payload.response)) {
    throw new Error(`API-Sports returned an unexpected response for ${path}.`);
  }

  diagnostics?.push(
    `${path} → ${payload.response.length} result(s)`
  );
  return payload.response;
}

export function validateFixturePreview(
  fixtures: FixturePreview[],
  competitionName = "Six Nations Championship"
) {
  const warnings: string[] = [];
  const sixNations = isSixNationsCompetition(competitionName);

  const missingTeams = fixtures.filter(
    (fixture) => !fixture.homeTeam || !fixture.awayTeam
  ).length;
  if (missingTeams > 0) {
    warnings.push(`${missingTeams} fixture(s) have a missing team.`);
  }

  if (sixNations && fixtures.length !== 15) {
    warnings.push(`Expected 15 fixtures but found ${fixtures.length}.`);
  }
  if (!sixNations && fixtures.length === 0) {
    warnings.push("No fixtures were returned.");
  }

  const pairKeys = fixtures
    .filter((fixture) => fixture.homeTeam && fixture.awayTeam)
    .map((fixture) =>
      sixNations
        ? [fixture.homeTeam, fixture.awayTeam].sort().join("|")
        : `${fixture.homeTeam}|${fixture.awayTeam}|${fixture.kickoffTime ?? ""}`
    );
  if (new Set(pairKeys).size !== pairKeys.length) {
    warnings.push(sixNations ? "One or more team pairings are duplicated." : "One or more fixture records are duplicated.");
  }

  if (sixNations) {
    for (const team of SIX_NATIONS_TEAMS) {
      const appearances = fixtures.filter(
        (fixture) => fixture.homeTeam === team || fixture.awayTeam === team
      ).length;
      if (appearances !== 5) {
        warnings.push(`${team} appears in ${appearances} fixtures; expected 5.`);
      }
    }
  }

  const missingKickoffs = fixtures.filter((fixture) => !fixture.kickoffTime).length;
  if (missingKickoffs > 0) {
    warnings.push(`${missingKickoffs} fixture(s) have no verified kickoff time.`);
  }
  const missingVenues = fixtures.filter((fixture) => !fixture.venue).length;
  if (missingVenues > 0) {
    warnings.push(`${missingVenues} fixture(s) have no stadium supplied.`);
  }

  return { warnings, valid: warnings.length === 0 };
}

export async function discoverCompetitionFixtures(
  competitionName: string,
  year: number,
  apiKey: string
): Promise<FixturePreviewResult> {
  const searchName = providerCompetitionSearchName(competitionName);
  const queryDiagnostics: string[] = [];
  const leagues = await providerGet<ApiLeague>(
    `leagues?search=${encodeURIComponent(searchName)}`,
    apiKey,
    queryDiagnostics
  );
  const target = normaliseCompetitionName(searchName);
  const candidates = leagues.filter(
    (league) =>
      normaliseCompetitionName(league.name).includes(target) &&
      seasonAvailable(league, year)
  );
  const league =
    candidates.find(
      (item) => normaliseCompetitionName(item.name) === target
    ) ?? candidates[0];

  if (!league?.id || !league.name) {
    throw new Error(
      `API-Sports has no ${searchName} competition available for season ${year}.`
    );
  }

  const crossYear = isCrossYearCompetition(competitionName);
  const providerSeasonCandidates = crossYear ? [year, year + 1] : [year];
  const gameBatches = await Promise.all(
    providerSeasonCandidates.map((season) =>
      providerGet<ApiGame>(
        `games?league=${league.id}&season=${season}`,
        apiKey,
        queryDiagnostics
      )
    )
  );
  let providerGames = gameBatches.flat();

  // Some API-Sports rugby competitions use a provider-specific season label.
  // If both likely season values return nothing for a cross-year competition,
  // fetch the league schedule without a season filter and constrain it by date below.
  if (crossYear && providerGames.length === 0) {
    providerGames = await providerGet<ApiGame>(
      `games?league=${league.id}`,
      apiKey,
      queryDiagnostics
    );
  }

  const games = Array.from(
    new Map(
      providerGames
        .map((game) => [game.id ?? `${game.date}-${teamName(game.teams?.home ?? game.home)}-${teamName(game.teams?.away ?? game.away)}`, game] as const)
    ).values()
  ).filter((game) => {
    if (!crossYear || !game.date) return true;
    const kickoff = new Date(game.date);
    if (Number.isNaN(kickoff.getTime())) return true;
    const seasonStart = Date.UTC(year, 6, 1);
    const seasonEnd = Date.UTC(year + 1, 6, 1);
    return kickoff.getTime() >= seasonStart && kickoff.getTime() < seasonEnd;
  });

  const sixNations = isSixNationsCompetition(competitionName);

  const fixtures = games
    .map((game): FixturePreview => {
      const providerHomeTeam = teamName(game.teams?.home ?? game.home);
      const providerAwayTeam = teamName(game.teams?.away ?? game.away);
      const venue = textValue(game.venue);
      const city =
        (typeof game.venue === "object" ? game.venue.city ?? null : null) ??
        game.city ??
        null;

      return {
        providerGameId: Number.isInteger(game.id) ? game.id! : null,
        round: roundNumber(game.round ?? game.week),
        kickoffTime: kickoffIso(game),
        homeTeam: sixNations
          ? canonicalSixNationsTeam(providerHomeTeam)
          : providerHomeTeam || null,
        awayTeam: sixNations
          ? canonicalSixNationsTeam(providerAwayTeam)
          : providerAwayTeam || null,
        providerHomeTeam,
        providerAwayTeam,
        venue,
        city,
        country: textValue(game.country ?? game.league?.country),
      };
    })
    .filter((fixture) => fixture.homeTeam || fixture.awayTeam)
    .sort((a, b) => String(a.kickoffTime).localeCompare(String(b.kickoffTime)));

  const participantTeams = Array.from(
    new Set(
      fixtures
        .flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
        .filter((team): team is string => Boolean(team))
    )
  ).sort((a, b) => a.localeCompare(b));

  const validation = validateFixturePreview(fixtures, competitionName);
  return {
    provider: "API-Sports",
    providerLeague: {
      id: league.id,
      name: league.name,
      seasons: Array.isArray(league.seasons)
        ? league.seasons
            .map((season) =>
              typeof season === "number"
                ? season
                : season.season ?? season.year ?? null
            )
            .filter((season): season is number => Number.isInteger(season))
        : [],
    },
    fixtures,
    participantTeams,
    warnings: validation.warnings,
    valid: validation.valid,
    expectedFixtureCount: sixNations ? 15 : fixtures.length,
    discoveredFixtureCount: fixtures.length,
    competitionKind: sixNations ? "SIX_NATIONS" : "LEAGUE",
    queryDiagnostics,
  };
}

// Backwards-compatible export for existing tests/imports.
export async function discoverSixNationsFixtures(year: number, apiKey: string) {
  return discoverCompetitionFixtures("Six Nations Championship", year, apiKey);
}
