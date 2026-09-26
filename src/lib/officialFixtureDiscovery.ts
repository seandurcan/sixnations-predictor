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
  JAN: 0, JANUARY: 0, FEB: 1, FEBRUARY: 1, MAR: 2, MARCH: 2,
  APR: 3, APRIL: 3, MAY: 4, JUN: 5, JUNE: 5, JUL: 6, JULY: 6,
  AUG: 7, AUGUST: 7, SEP: 8, SEPT: 8, SEPTEMBER: 8, OCT: 9,
  OCTOBER: 9, NOV: 10, NOVEMBER: 10, DEC: 11, DECEMBER: 11,
};

const ONLINE_TEAM_NAMES = [
  "Benetton", "Dragons", "Dragons RFC", "Connacht", "Stormers", "DHL Stormers",
  "Ulster", "Edinburgh", "Lions", "10bet Lions", "Leinster", "Sharks",
  "Hollywoodbets Sharks", "Ospreys", "Munster", "Glasgow Warriors", "Zebre",
  "Zebre Parma", "Bulls", "Vodacom Bulls", "Scarlets", "Cardiff", "Cardiff Rugby",
];

function canonicalOnlineTeam(value: string) {
  const key = normalise(value);
  const map: Record<string, string> = {
    benetton: "Benetton", dragons: "Dragons RFC", dragonsrfc: "Dragons RFC",
    connacht: "Connacht", stormers: "DHL Stormers", dhlstormers: "DHL Stormers",
    ulster: "Ulster", edinburgh: "Edinburgh", lions: "Lions", "10betlions": "Lions",
    leinster: "Leinster", sharks: "Sharks", hollywoodbetssharks: "Sharks",
    ospreys: "Ospreys", munster: "Munster", glasgowwarriors: "Glasgow Warriors",
    zebre: "Zebre Parma", zebreparma: "Zebre Parma", bulls: "Bulls",
    vodacombulls: "Bulls", scarlets: "Scarlets", cardiff: "Cardiff",
    cardiffrugby: "Cardiff",
  };
  return map[key] ?? value.trim();
}

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

function parseUrcOnlineFallbackHtml(html: string, seasonStartYear: number) {
  const text = decodeHtml(html);
  const fixtures: FixturePreview[] = [];
  const diagnostics: string[] = [];
  const teamPattern = ONLINE_TEAM_NAMES
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^$(){}|[\]\\]/g, "\\export async function discoverOfficialCompetitionFixtures("))
    .join("|");
  const sectionRegex = /Round\s+(\d{1,2})([\s\S]*?)(?=Round\s+\d{1,2}|Quarter-finals|Semi-finals|Final|$)/gi;
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionRegex.exec(text)) !== null) {
    const round = Number(sectionMatch[1]);
    const section = sectionMatch[2];
    const matchRegex = new RegExp(
      "(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\\s+(\\d{1,2})\\s+" +
      "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+" +
      "(" + teamPattern + ")\\s+v\\s+(" + teamPattern + ")\\s+\\((\\d{1,2})(?:\\.|:)(\\d{2})(am|pm)\\)",
      "gi"
    );
    let match: RegExpExecArray | null;
    while ((match = matchRegex.exec(section)) !== null) {
      const day = Number(match[1]);
      const month = MONTHS[match[2].toUpperCase()];
      let hour = Number(match[5]) % 12;
      if (match[7].toLowerCase() === "pm") hour += 12;
      const minute = Number(match[6]);
      const fixtureYear = seasonYearForMonth(seasonStartYear, month);
      const home = canonicalOnlineTeam(match[3]);
      const away = canonicalOnlineTeam(match[4]);
      fixtures.push({
        providerGameId: null,
        round,
        kickoffTime: localDublinToIso(fixtureYear, month, day, hour, minute),
        homeTeam: home,
        awayTeam: away,
        providerHomeTeam: home,
        providerAwayTeam: away,
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

  diagnostics.push(`Online published fixture list: ${unique.length} fixture(s) parsed.`);
  return { fixtures: unique, diagnostics };
}

export async function discoverOfficialCompetitionFixtures(
  competitionName: string,
  year: number
): Promise<FixturePreviewResult> {
  if (!supportsOfficialFixtureDiscovery(competitionName)) {
    throw new Error("No official fixture-source adapter is configured for this competition yet.");
  }

  const officialUrl = "https://stats.unitedrugby.com/";
  const fallbackUrl = "https://www.rugbyworld.com/rugby-fixtures/united-rugby-championship-fixtures";
  let parsed: ReturnType<typeof parseUrcOfficialHtml>;
  let sourceName = "Official United Rugby Championship Match Centre";
  let sourceUrl = officialUrl;

  const officialResponse = await fetch(officialUrl, {
    cache: "no-store",
    headers: {
      "user-agent": "PerfectXV fixture importer/1.0",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (officialResponse.ok) {
    parsed = parseUrcOfficialHtml(await officialResponse.text(), year);
  } else {
    parsed = {
      fixtures: [],
      diagnostics: [`Official URC Match Centre returned HTTP ${officialResponse.status}.`],
    };
  }

  if (parsed.fixtures.length < 100) {
    const fallbackResponse = await fetch(fallbackUrl, {
      cache: "no-store",
      headers: {
        "user-agent": "PerfectXV fixture importer/1.0",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!fallbackResponse.ok) {
      throw new Error(
        `Official URC Match Centre could not be parsed and the published fixture fallback returned HTTP ${fallbackResponse.status}.`
      );
    }
    const fallback = parseUrcOnlineFallbackHtml(await fallbackResponse.text(), year);
    parsed = {
      fixtures: fallback.fixtures,
      diagnostics: [
        ...parsed.diagnostics,
        "Official Match Centre layout could not be parsed server-side; used the published Rugby World fixture list as fallback.",
        ...fallback.diagnostics,
      ],
    };
    sourceName = "Published URC fixture list (Rugby World fallback)";
    sourceUrl = fallbackUrl;
  }

  if (parsed.fixtures.length === 0) {
    throw new Error("No URC fixtures could be extracted from the available online sources.");
  }

  const participantTeams = Array.from(
    new Set(parsed.fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam]).filter((team): team is string => Boolean(team)))
  ).sort((a, b) => a.localeCompare(b));

  return {
    provider: "Official / Online",
    providerLeague: { id: 0, name: sourceName },
    fixtures: parsed.fixtures,
    participantTeams,
    warnings: parsed.fixtures.length < 144
      ? ["Online fixture discovery returned fewer than the expected 144 regular-season fixtures. Review carefully before importing."]
      : ["Stadiums may be blank in the online fallback and can be completed later if required."],
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
