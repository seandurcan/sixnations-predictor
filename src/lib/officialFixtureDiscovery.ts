import type { FixturePreview, FixturePreviewResult } from "@/lib/fixtureDiscovery";

const MONTHS: Record<string, number> = {
  JAN: 0, JANUARY: 0,
  FEB: 1, FEBRUARY: 1,
  MAR: 2, MARCH: 2,
  APR: 3, APRIL: 3,
  MAY: 4,
  JUN: 5, JUNE: 5,
  JUL: 6, JULY: 6,
  AUG: 7, AUGUST: 7,
  SEP: 8, SEPT: 8, SEPTEMBER: 8,
  OCT: 9, OCTOBER: 9,
  NOV: 10, NOVEMBER: 10,
  DEC: 11, DECEMBER: 11,
};

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

const URC_ONLINE_TEAMS = [
  "Benetton", "Dragons", "Dragons RFC", "Connacht", "Stormers", "DHL Stormers",
  "Ulster", "Edinburgh", "Lions", "10bet Lions", "Leinster", "Sharks",
  "Hollywoodbets Sharks", "Ospreys", "Munster", "Glasgow Warriors", "Zebre",
  "Zebre Parma", "Bulls", "Vodacom Bulls", "Scarlets", "Cardiff", "Cardiff Rugby",
];

const CHALLENGE_CUP_TEAMS = [
  "Dragons", "Dragons RFC", "Perpignan", "USAP", "Edinburgh", "Edinburgh Rugby",
  "Toulon", "RC Toulon", "Black Lion", "Ospreys", "Lyon", "LOU Rugby",
  "Hollywoodbets Sharks", "Zebre Parma", "Ulster", "Ulster Rugby", "Scarlets",
  "Newcastle Red Bulls", "Bayonne", "Aviron Bayonnais", "Toyota Cheetahs",
  "Cheetahs", "Harlequins", "Vannes", "RC Vannes", "Castres",
  "Castres Olympique", "Benetton", "Benetton Rugby",
];

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

function isUrc(name: string) {
  return normalise(name).includes("unitedrugbychampionship");
}

function isChallengeCup(name: string) {
  const key = normalise(name);
  return key.includes("challengecup") || key.includes("epcrchallengecup");
}

export function supportsOfficialFixtureDiscovery(name: string) {
  return isUrc(name) || isChallengeCup(name);
}

function canonicalUrcTeam(value: string) {
  const key = normalise(value);
  const map: Record<string, string> = {
    benetton: "Benetton",
    dragons: "Dragons RFC",
    dragonsrfc: "Dragons RFC",
    connacht: "Connacht",
    stormers: "DHL Stormers",
    dhlstormers: "DHL Stormers",
    ulster: "Ulster",
    edinburgh: "Edinburgh",
    lions: "Lions",
    "10betlions": "Lions",
    leinster: "Leinster",
    sharks: "Sharks",
    hollywoodbetssharks: "Sharks",
    ospreys: "Ospreys",
    munster: "Munster",
    glasgowwarriors: "Glasgow Warriors",
    zebre: "Zebre Parma",
    zebreparma: "Zebre Parma",
    bulls: "Bulls",
    vodacombulls: "Bulls",
    scarlets: "Scarlets",
    cardiff: "Cardiff",
    cardiffrugby: "Cardiff",
  };
  return map[key] ?? value.trim();
}

function canonicalChallengeCupTeam(value: string) {
  const key = normalise(value);
  const map: Record<string, string> = {
    dragons: "Dragons RFC",
    dragonsrfc: "Dragons RFC",
    perpignan: "USAP",
    usap: "USAP",
    edinburgh: "Edinburgh Rugby",
    edinburghrugby: "Edinburgh Rugby",
    toulon: "RC Toulon",
    rctoulon: "RC Toulon",
    blacklion: "Black Lion",
    ospreys: "Ospreys",
    lyon: "LOU Rugby",
    lourugby: "LOU Rugby",
    hollywoodbetssharks: "Hollywoodbets Sharks",
    sharks: "Hollywoodbets Sharks",
    zebreparma: "Zebre Parma",
    ulster: "Ulster Rugby",
    ulsterrugby: "Ulster Rugby",
    scarlets: "Scarlets",
    newcastleredbulls: "Newcastle Red Bulls",
    bayonne: "Aviron Bayonnais",
    avironbayonnais: "Aviron Bayonnais",
    toyotacheetahs: "Toyota Cheetahs",
    cheetahs: "Toyota Cheetahs",
    harlequins: "Harlequins",
    vannes: "RC Vannes",
    rcvannes: "RC Vannes",
    castres: "Castres Olympique",
    castresolympique: "Castres Olympique",
    benetton: "Benetton Rugby",
    benettonrugby: "Benetton Rugby",
  };
  return map[key] ?? value.trim();
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

function localDublinToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
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
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    const represented = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute")
    );
    candidate += Date.UTC(year, month, day, hour, minute) - represented;
  }
  return new Date(candidate).toISOString();
}

function seasonYearForMonth(startYear: number, month: number) {
  return month >= 6 ? startYear : startYear + 1;
}

function uniqueFixtures(fixtures: FixturePreview[]) {
  return Array.from(
    new Map(
      fixtures.map((fixture) => [
        `${fixture.round}|${fixture.kickoffTime}|${fixture.homeTeam}|${fixture.awayTeam}`,
        fixture,
      ])
    ).values()
  ).sort((a, b) =>
    String(a.kickoffTime).localeCompare(String(b.kickoffTime))
  );
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
    const matchRegex =
      /(?:MON|TUE|WED|THU|FRI|SAT|SUN)[A-Z]*,?\s+(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)(?:EMBER|OBER|UARY|CH|IL|E|Y|UST)?\s*(?:•|\|)?\s*(\d{1,2}):(\d{2})\s+(BEN|DRA|CON|STO|ULS|EDI|LIO|LEI|SHA|OSP|MUN|GLA|ZEB|BUL|SCA|CAR)\b[\s\S]{0,80}?\b(?:v|VS|LIVE|FT|FULL TIME)?\s*[0-9\- ]{0,12}\s*(BEN|DRA|CON|STO|ULS|EDI|LIO|LEI|SHA|OSP|MUN|GLA|ZEB|BUL|SCA|CAR)\b/gi;

    let match: RegExpExecArray | null;
    while ((match = matchRegex.exec(section)) !== null) {
      const day = Number(match[1]);
      const month = MONTHS[match[2].toUpperCase()];
      const hour = Number(match[3]);
      const minute = Number(match[4]);
      const homeCode = match[5].toUpperCase();
      const awayCode = match[6].toUpperCase();
      const fixtureYear = seasonYearForMonth(seasonStartYear, month);
      const home = URC_TEAM_CODES[homeCode] ?? homeCode;
      const away = URC_TEAM_CODES[awayCode] ?? awayCode;
      fixtures.push({
        providerGameId: null,
        round,
        kickoffTime: localDublinToIso(
          fixtureYear,
          month,
          day,
          hour,
          minute
        ),
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

  const unique = uniqueFixtures(fixtures);
  diagnostics.push(
    `Official URC Match Centre: ${unique.length} fixture(s) parsed.`
  );
  return { fixtures: unique, diagnostics };
}

function parseRugbyWorldSchedule(
  html: string,
  seasonStartYear: number,
  teamNames: string[],
  canonicalise: (value: string) => string,
  expectedRounds: number
) {
  const text = decodeHtml(html);
  const fixtures: FixturePreview[] = [];
  const teamPattern = teamNames
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");

  for (let round = 1; round <= expectedRounds; round += 1) {
    const sectionMatch = text.match(
      new RegExp(
        `Round\\s+${round}([\\s\\S]*?)(?=Round\\s+${round + 1}\\b|Round of 16|Quarter-finals|Semi-finals|The Final|Final|$)`,
        "i"
      )
    );
    if (!sectionMatch) continue;

    const section = sectionMatch[1];
    const matchRegex = new RegExp(
      "(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\\s+" +
        "(\\d{1,2})\\s+" +
        "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+" +
        "(" +
        teamPattern +
        ")\\s+v\\s+(" +
        teamPattern +
        ")\\s+\\((\\d{1,2})(?:\\.|:)?(\\d{2})?(am|pm)\\)",
      "gi"
    );

    let match: RegExpExecArray | null;
    while ((match = matchRegex.exec(section)) !== null) {
      const day = Number(match[1]);
      const month = MONTHS[match[2].toUpperCase()];
      let hour = Number(match[5]) % 12;
      if (match[7].toLowerCase() === "pm") hour += 12;
      const minute = match[6] ? Number(match[6]) : 0;
      const fixtureYear = seasonYearForMonth(seasonStartYear, month);
      const home = canonicalise(match[3]);
      const away = canonicalise(match[4]);

      fixtures.push({
        providerGameId: null,
        round,
        kickoffTime: localDublinToIso(
          fixtureYear,
          month,
          day,
          hour,
          minute
        ),
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

  return uniqueFixtures(fixtures);
}

async function discoverUrc(year: number): Promise<FixturePreviewResult> {
  const officialUrl = "https://stats.unitedrugby.com/";
  const fallbackUrl =
    "https://www.rugbyworld.com/rugby-fixtures/united-rugby-championship-fixtures";

  let parsed = { fixtures: [] as FixturePreview[], diagnostics: [] as string[] };
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
    parsed.diagnostics.push(
      `Official URC Match Centre returned HTTP ${officialResponse.status}.`
    );
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
    const fallbackFixtures = parseRugbyWorldSchedule(
      await fallbackResponse.text(),
      year,
      URC_ONLINE_TEAMS,
      canonicalUrcTeam,
      18
    );
    parsed = {
      fixtures: fallbackFixtures,
      diagnostics: [
        ...parsed.diagnostics,
        "Official Match Centre layout could not be parsed server-side; used the published Rugby World fixture list as fallback.",
        `Online published fixture list: ${fallbackFixtures.length} fixture(s) parsed.`,
      ],
    };
    sourceName = "Published URC fixture list (Rugby World fallback)";
    sourceUrl = fallbackUrl;
  }

  if (parsed.fixtures.length === 0) {
    throw new Error(
      "No URC fixtures could be extracted from the available online sources."
    );
  }

  const participantTeams = Array.from(
    new Set(
      parsed.fixtures
        .flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
        .filter((team): team is string => Boolean(team))
    )
  ).sort((a, b) => a.localeCompare(b));

  return {
    provider: "Official / Online",
    providerLeague: { id: 0, name: sourceName },
    fixtures: parsed.fixtures,
    participantTeams,
    warnings:
      parsed.fixtures.length < 144
        ? [
            "Online fixture discovery returned fewer than the expected 144 regular-season fixtures. Review carefully before importing.",
          ]
        : [
            "Stadiums may be blank in the online fallback and can be completed later if required.",
          ],
    valid: parsed.fixtures.length >= 144,
    expectedFixtureCount: 144,
    discoveredFixtureCount: parsed.fixtures.length,
    competitionKind: "LEAGUE",
    queryDiagnostics: [...parsed.diagnostics, `Source: ${sourceUrl}`],
  };
}

async function discoverChallengeCup(
  year: number
): Promise<FixturePreviewResult> {
  const officialUrl = "https://www.epcrugby.com/challenge-cup/matches";
  const fallbackUrl =
    "https://www.rugbyworld.com/rugby-fixtures/epcr-challenge-cup-fixtures";

  const diagnostics: string[] = [];
  let fixtures: FixturePreview[] = [];
  let sourceName = "Official EPCR Challenge Cup Fixtures & Results";
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
    const officialText = decodeHtml(await officialResponse.text());
    fixtures = parseRugbyWorldSchedule(
      officialText,
      year,
      CHALLENGE_CUP_TEAMS,
      canonicalChallengeCupTeam,
      4
    );
    diagnostics.push(
      `Official EPCR fixtures page: ${fixtures.length} pool fixture(s) parsed.`
    );
  } else {
    diagnostics.push(
      `Official EPCR fixtures page returned HTTP ${officialResponse.status}.`
    );
  }

  if (fixtures.length < 36) {
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
        `The EPCR fixture page could not be fully parsed and the published fixture fallback returned HTTP ${fallbackResponse.status}.`
      );
    }

    const fallbackFixtures = parseRugbyWorldSchedule(
      await fallbackResponse.text(),
      year,
      CHALLENGE_CUP_TEAMS,
      canonicalChallengeCupTeam,
      4
    );

    fixtures = fallbackFixtures;
    sourceName = "Published EPCR Challenge Cup fixture list (Rugby World fallback)";
    sourceUrl = fallbackUrl;
    diagnostics.push(
      "Official EPCR page did not expose the full pool schedule server-side; used the published Rugby World fixture list as fallback."
    );
    diagnostics.push(
      `Published Challenge Cup pool fixtures: ${fixtures.length} fixture(s) parsed.`
    );
  }

  if (fixtures.length === 0) {
    throw new Error(
      "No EPCR Challenge Cup pool fixtures could be extracted from the available online sources."
    );
  }

  const participantTeams = Array.from(
    new Set(
      fixtures
        .flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
        .filter((team): team is string => Boolean(team))
    )
  ).sort((a, b) => a.localeCompare(b));

  return {
    provider: "Official / Online",
    providerLeague: { id: 0, name: sourceName },
    fixtures,
    participantTeams,
    warnings:
      fixtures.length === 36
        ? [
            "Pool-stage fixtures found. Stadiums may be blank and can remain TBC for the initial import.",
          ]
        : [
            `Expected 36 pool-stage fixtures but found ${fixtures.length}. Review before importing.`,
          ],
    valid: fixtures.length === 36,
    expectedFixtureCount: 36,
    discoveredFixtureCount: fixtures.length,
    competitionKind: "LEAGUE",
    queryDiagnostics: [...diagnostics, `Source: ${sourceUrl}`],
  };
}

export async function discoverOfficialCompetitionFixtures(
  competitionName: string,
  year: number
): Promise<FixturePreviewResult> {
  if (isUrc(competitionName)) {
    return discoverUrc(year);
  }

  if (isChallengeCup(competitionName)) {
    return discoverChallengeCup(year);
  }

  throw new Error(
    "No online fixture-source adapter is configured for this competition yet."
  );
}
