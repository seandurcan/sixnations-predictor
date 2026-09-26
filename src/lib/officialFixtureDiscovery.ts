import type { FixturePreview, FixturePreviewResult } from "@/lib/fixtureDiscovery";

const URC_TEAM_CODES: Record<string, string> = {
  BEN: "Benetton",
  DRA: "Dragons RFC",
  CON: "Connacht",
  STO: "DHL Stormers",
  ULS: "Ulster",
  EDI: "Edinburgh",
  LIO: "Lions",
  LEI: "Leinster",
  SHA: "Sharks",
  OSP: "Ospreys",
  MUN: "Munster",
  GLA: "Glasgow Warriors",
  ZEB: "Zebre Parma",
  BUL: "Bulls",
  SCA: "Scarlets",
  CAR: "Cardiff",
};

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, SEPT: 8, OCT: 9, NOV: 10, DEC: 11,
};

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function supportsOfficialFixtureDiscovery(name: string) {
  return normalise(name).includes("unitedrugbychampionship");
}

function decodeHtml(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8211;|&#8212;/gi, "-")
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function localDublinToIso(year: number, month: number, day: number, hour: number, minute: number) {
  // Start with the local wall-clock interpreted as UTC, then resolve the actual
  // Europe/Dublin offset for that instant. A second pass handles DST boundaries.
  let candidate = Date.UTC(year, month, day, hour, minute);
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Dublin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    candidate += Date.UTC(year, month, day, hour, minute) - represented;
  }
  return new Date(candidate).toISOString();
}

function seasonYearForMonth(startYear: number, month: number) {
  return month >= 6 ? startYear : startYear + 1;
}

function parseUrcOfficialHtml(html: string, seasonStartYear: number) {
  const text = decodeHtml(html);
  const fixtures: FixturePreview[] = [];
  const diagnostics: string[] = [];
  const sectionRegex = /ROUND\s+(\d{1,2})([\s\S]*?)(?=ROUND\s+\d{1,2}|$)/gi;
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionRegex.exec(text)) !== null) {
    const round = Number(sectionMatch[1]);
    const section = sectionMatch[2];
    const matchRegex = /(?:MON|TUE|WED|THU|FRI|SAT|SUN)[A-Z]*,?\s+(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)(?:EMBER|OBER|UARY|CH|IL|E|Y|UST)?\s*(?:•|\|)?\s*(\d{1,2}):(\d{2})\s+(BEN|DRA|CON|STO|ULS|EDI|LIO|LEI|SHA|OSP|MUN|GLA|ZEB|BUL|SCA|CAR)\b[\s\S]{0,80}?\b(?:v|VS|LIVE|FT|FULL TIME)?\s*[0-9\- ]{0,12}\s*(BEN|DRA|CON|STO|ULS|EDI|LIO|LEI|SHA|OSP|MUN|GLA|ZEB|BUL|SCA|CAR)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = matchRegex.exec(section)) !== null) {
      const day = Number(match[1]);
      const month = MONTHS[match[2].toUpperCase()];
      const hour = Number(match[3]);
      const minute = Number(match[4]);
      const homeCode = match[5].toUpperCase();
      const awayCode = match[6].toUpperCase();
      const year = seasonYearForMonth(seasonStartYear, month);
      fixtures.push({
        providerGameId: null,
        round,
        kickoffTime: localDublinToIso(year, month, day, hour, minute),
        homeTeam: URC_TEAM_CODES[homeCode] ?? homeCode,
        awayTeam: URC_TEAM_CODES[awayCode] ?? awayCode,
        providerHomeTeam: URC_TEAM_CODES[homeCode] ?? homeCode,
        providerAwayTeam: URC_TEAM_CODES[awayCode] ?? awayCode,
        venue: null,
        city: null,
        country: null,
      });
    }
  }

  const unique = Array.from(
    new Map(fixtures.map((fixture) => [
      `${fixture.round}|${fixture.kickoffTime}|${fixture.homeTeam}|${fixture.awayTeam}`,
      fixture,
    ])).values()
  ).sort((a, b) => String(a.kickoffTime).localeCompare(String(b.kickoffTime)));

  diagnostics.push(`Official URC Match Centre: ${unique.length} fixture(s) parsed.`);
  if (unique.length < 100) {
    diagnostics.push("The official source returned fewer regular-season fixtures than expected; review before importing.");
  }
  return { fixtures: unique, diagnostics };
}

export async function discoverOfficialCompetitionFixtures(
  competitionName: string,
  year: number
): Promise<FixturePreviewResult> {
  if (!supportsOfficialFixtureDiscovery(competitionName)) {
    throw new Error("No official fixture-source adapter is configured for this competition yet.");
  }

  const sourceUrl = "https://stats.unitedrugby.com/";
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    headers: {
      "user-agent": "PerfectXV fixture importer/1.0",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Official URC Match Centre returned HTTP ${response.status}.`);
  }

  const html = await response.text();
  const parsed = parseUrcOfficialHtml(html, year);
  if (parsed.fixtures.length === 0) {
    throw new Error("The official URC fixture page was reached, but no fixtures could be parsed from its current layout.");
  }

  const participantTeams = Array.from(
    new Set(parsed.fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam]).filter((team): team is string => Boolean(team)))
  ).sort((a, b) => a.localeCompare(b));

  return {
    provider: "API-Sports",
    providerLeague: { id: 0, name: "Official United Rugby Championship Match Centre" },
    fixtures: parsed.fixtures,
    participantTeams,
    warnings: parsed.fixtures.length < 144
      ? ["Official source returned fewer than the expected 144 regular-season fixtures. Review carefully before importing."]
      : [],
    valid: parsed.fixtures.length >= 144,
    expectedFixtureCount: 144,
    discoveredFixtureCount: parsed.fixtures.length,
    competitionKind: "LEAGUE",
    queryDiagnostics: [
      ...parsed.diagnostics,
      `Source: ${sourceUrl}`,
    ],
  };
}
