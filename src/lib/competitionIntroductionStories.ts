import { prisma } from "@/lib/prisma";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { headers } from "next/headers";
import type { StoryPayload } from "@/lib/competitionStories";

export const COMPETITION_INTRO_STORY_PREFIX = "COMPETITION_INTRO_STORY_";
const INTRO_VERSION = 1;

type Winner = {
  edition: string;
  winner: string;
};

type CompetitionProfile = {
  match: (name: string) => boolean;
  endDate?: string;
  headline: (title: string) => string;
  standfirst: (title: string) => string;
  recentWinners: Winner[];
  facts: string[];
  teamStructure?: string[];
  sources: Array<{ label: string; url: string }>;
};

function key(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const PROFILES: CompetitionProfile[] = [
  {
    match: (name) => key(name).includes("sixnations"),
    headline: () => "Six Nations 2027: the stage is set for five rounds of European rivalry",
    standfirst: () =>
      "Six teams, 15 matches and five championship weekends lie ahead as the 2027 Six Nations prepares to open under the Friday-night lights in Dublin.",
    recentWinners: [
      { edition: "2026", winner: "France" },
      { edition: "2025", winner: "France" },
      { edition: "2024", winner: "Ireland" },
      { edition: "2023", winner: "Ireland" },
      { edition: "2022", winner: "France" },
    ],
    facts: [
      "The Championship traces its roots to 1883, while the modern six-team era began in 2000 when Italy joined England, France, Ireland, Scotland and Wales.",
      "France and Ireland have shared the last five titles: France won in 2022, 2025 and 2026, while Ireland took the crown in 2023 and 2024.",
      "The 2027 Championship opens with Ireland against England in Dublin and closes on Super Saturday with Ireland against France at the Aviva Stadium.",
    ],
    sources: [
      {
        label: "Six Nations Rugby — 2027 fixtures",
        url: "https://www.sixnationsrugby.com/en/m6n/news/fixtures-round-by-round-guide-to-every-match-2027-six-nations",
      },
      {
        label: "Six Nations Rugby — Championship history",
        url: "https://www.sixnationsrugby.com/en/m6n/championship-history-mens",
      },
    ],
  },
  {
    match: (name) => key(name).includes("rugbyworldcup") || key(name) === "worldcup",
    endDate: "2027-11-13T09:00:00.000Z",
    headline: () => "Rugby World Cup 2027: a bigger tournament awaits in Australia",
    standfirst: () =>
      "The Men's Rugby World Cup expands to 24 teams in 2027, bringing 52 matches, a new round of 16 and six weeks of rugby across Australia.",
    recentWinners: [
      { edition: "2023", winner: "South Africa" },
      { edition: "2019", winner: "South Africa" },
      { edition: "2015", winner: "New Zealand" },
      { edition: "2011", winner: "New Zealand" },
      { edition: "2007", winner: "South Africa" },
    ],
    facts: [
      "The 2027 tournament is the first Men's Rugby World Cup to feature 24 teams, arranged in six pools of four before a new round of 16.",
      "The top two teams in each pool plus the four best third-placed teams will advance to the knockout phase.",
      "Australia will stage 52 matches across 19 match days, seven host cities and eight venues, with the final at Stadium Australia in Sydney on 13 November.",
      "South Africa arrive as back-to-back champions after 2019 and 2023 and have won three of the last five Rugby World Cups; New Zealand won the other two.",
      "The pool phase ends with a five-match 'Super Sunday' on 17 October, the first time five Rugby World Cup matches are scheduled on the same day.",
    ],
    teamStructure: [
      "Pool A: New Zealand, Australia, Chile and Hong Kong China.",
      "Pool B: South Africa, Italy, Georgia and Romania.",
      "Pool C: Argentina, Fiji, Spain and Canada.",
      "Pool D: Ireland, Scotland, Uruguay and Portugal.",
      "Pool E: France, Japan, USA and Samoa.",
      "Pool F: England, Wales, Tonga and Zimbabwe.",
    ],
    sources: [
      {
        label: "Rugby World Cup — 2027 tournament",
        url: "https://www.rugbyworldcup.com/2027/en/",
      },
      {
        label: "Rugby World Cup — 2027 schedule",
        url: "https://www.rugbyworldcup.com/en/news/1020949/mens-rugby-world-cup-2027-schedule-revealed-with-first-tickets-available-from-18-february",
      },
      {
        label: "Rugby World Cup — tournament history",
        url: "https://www.rugbyworldcup.com/en/news/617532/tournament-history",
      },
    ],
  },
  {
    match: (name) => key(name).includes("challengecup"),
    headline: (title) => title + ": Europe's Challenge Cup race is ready to begin",
    standfirst: () =>
      "A new EPCR Challenge Cup campaign brings clubs from across European and South African rugby together with knockout qualification and a major European trophy at stake.",
    recentWinners: [
      { edition: "2026", winner: "Montpellier Hérault Rugby" },
      { edition: "2025", winner: "Bath Rugby" },
      { edition: "2024", winner: "Hollywoodbets Sharks" },
      { edition: "2023", winner: "RC Toulon" },
      { edition: "2022", winner: "Lyon Olympique Universitaire" },
    ],
    facts: [
      "The Challenge Cup has produced five different champions in the last five editions, underlining the competition's variety.",
      "Montpellier Hérault Rugby won the 2026 final 59-26 against Ulster Rugby to claim a third Challenge Cup title.",
    ],
    sources: [
      {
        label: "EPCR — Challenge Cup roll of honour",
        url: "https://historical-stats.epcrugby.com/challenge-cup/history/roll-of-honour/",
      },
    ],
  },
];

function profileFor(name: string) {
  return PROFILES.find((profile) => profile.match(name)) ?? null;
}

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Dublin",
  }).format(value);
}

function durationLabel(start: Date, end: Date) {
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  if (weeks > 0 && remainder > 0) {
    return `${weeks} week${weeks === 1 ? "" : "s"} and ${remainder} day${remainder === 1 ? "" : "s"}`;
  }
  if (weeks > 0) return `${weeks} week${weeks === 1 ? "" : "s"}`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

function listNames(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(" and ");
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

function winnerHistoryText(winners: Winner[]) {
  return winners.map((winner) => `${winner.edition} — ${winner.winner}`).join("; ");
}

async function getGatewayToken() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;

  try {
    const requestHeaders = await headers();
    const requestToken = requestHeaders.get("x-vercel-oidc-token");
    if (requestToken) return requestToken;
  } catch {
    // Fall back to environment OIDC when not running in a request.
  }

  return process.env.VERCEL_OIDC_TOKEN ?? null;
}

function parseAiArticle(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "");

  try {
    const parsed = JSON.parse(cleaned) as {
      headline?: unknown;
      standfirst?: unknown;
      body?: unknown;
    };
    if (
      typeof parsed.headline !== "string" ||
      typeof parsed.standfirst !== "string" ||
      typeof parsed.body !== "string"
    ) {
      return null;
    }
    return {
      headline: parsed.headline.trim(),
      standfirst: parsed.standfirst.trim(),
      body: parsed.body.trim().replace(/\\n\\n/g, "\n\n"),
    };
  } catch {
    return null;
  }
}

async function writeAiIntroduction(factPack: unknown) {
  const token = await getGatewayToken();
  if (!token) return null;

  const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-luna",
      messages: [
        {
          role: "system",
          content: [
            "You are the Perfect XV Sports Desk, writing a pre-tournament rugby news feature.",
            "Use only the verified facts supplied. Never invent history, teams, dates, venues, records, quotations or predictions.",
            "Write in natural British/Irish English with the pace and warmth of a good newspaper sports preview.",
            "Cover when the tournament starts and finishes, its duration, the participating teams, the five most recent winners supplied, and the notable facts supplied.",
            "Do not turn the article into a list or database dump. Weave the information into 5-7 short paragraphs.",
            "Do not predict the winner.",
            "Return JSON only with exactly three string fields: headline, standfirst, body.",
            "The body must use real paragraph breaks and no Markdown.",
          ].join(" "),
        },
        {
          role: "user",
          content:
            "Write the introductory competition article from this verified fact pack:\n\n" +
            JSON.stringify(factPack),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1100,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  return raw ? parseAiArticle(raw) : null;
}

function fallbackArticle(args: {
  title: string;
  start: Date;
  end: Date;
  fixtureCount: number;
  teams: string[];
  profile: CompetitionProfile | null;
}) {
  const { title, start, end, fixtureCount, teams, profile } = args;
  const headline =
    profile?.headline(title) ?? `${title}: the competition ahead`;
  const standfirst =
    profile?.standfirst(title) ??
    `${title} is ready to get under way, with ${teams.length} teams and ${fixtureCount} fixtures on the Perfect XV schedule.`;

  const paragraphs: string[] = [
    `${title} begins on ${dateLabel(start)} and runs until ${dateLabel(end)}, a span of ${durationLabel(start, end)}. The Perfect XV schedule currently contains ${fixtureCount} fixture${fixtureCount === 1 ? "" : "s"}.`,
  ];

  if (profile?.teamStructure?.length) {
    paragraphs.push(
      `The field is made up of ${teams.length} teams. ${profile.teamStructure.join(" ")}`
    );
  } else if (teams.length > 0) {
    paragraphs.push(
      `The teams taking part are ${listNames(teams)}.`
    );
  }

  if (profile?.recentWinners.length) {
    paragraphs.push(
      `The recent roll of honour offers plenty of context. The last five tournament winners were ${winnerHistoryText(profile.recentWinners)}.`
    );
  }

  if (profile?.facts.length) {
    paragraphs.push(...profile.facts);
  }

  paragraphs.push(
    "For Perfect XV entrants, the opening whistle also starts the scoring story: every completed round will generate its own report as the leaderboard develops."
  );

  return { headline, standfirst, body: paragraphs.join("\n\n") };
}

export async function generateCompetitionIntroductionStory(
  tournamentId: number
): Promise<StoryPayload | null> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      year: true,
      status: true,
      firstKickoff: true,
      matches: {
        orderBy: [{ kickoffTime: "asc" }, { matchNumber: "asc" }],
        select: {
          kickoffTime: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  });

  if (!tournament || tournament.matches.length === 0) return null;

  const start = tournament.firstKickoff ?? tournament.matches[0].kickoffTime;
  const profile = profileFor(tournament.name);
  const finalImportedKickoff =
    tournament.matches[tournament.matches.length - 1].kickoffTime;
  const profileEnd = profile?.endDate ? new Date(profile.endDate) : null;
  const end =
    profileEnd && !Number.isNaN(profileEnd.getTime())
      ? profileEnd
      : finalImportedKickoff;

  const teams = Array.from(
    new Set(
      tournament.matches.flatMap((match) => [
        match.homeTeam.name,
        match.awayTeam.name,
      ])
    )
  ).sort((a, b) => a.localeCompare(b));

  const title = formatCompetitionTitle(tournament.name, tournament.year);
  const factPack = {
    competition: title,
    starts: dateLabel(start),
    finishes: dateLabel(end),
    duration: durationLabel(start, end),
    fixtureCount: tournament.matches.length,
    teamCount: teams.length,
    teams,
    teamStructure: profile?.teamStructure ?? [],
    recentWinners: profile?.recentWinners ?? [],
    notableFacts: profile?.facts ?? [],
  };

  let article = await writeAiIntroduction(factPack).catch(() => null);
  let generation: StoryPayload["generation"] = "ai";

  if (!article) {
    article = fallbackArticle({
      title,
      start,
      end,
      fixtureCount: tournament.matches.length,
      teams,
      profile,
    });
    generation = "fallback";
  }

  const payload: StoryPayload = {
    tournamentId,
    round: 0,
    kind: "introduction",
    headline: article.headline,
    standfirst: article.standfirst,
    body: article.body,
    generatedAt: new Date().toISOString(),
    version: INTRO_VERSION,
    generation,
    sources: profile?.sources ?? [],
  };

  await prisma.systemSetting.upsert({
    where: { key: COMPETITION_INTRO_STORY_PREFIX + tournamentId },
    update: { value: JSON.stringify(payload) },
    create: {
      key: COMPETITION_INTRO_STORY_PREFIX + tournamentId,
      value: JSON.stringify(payload),
    },
  });

  return payload;
}

export async function ensureCompetitionIntroductionStories() {
  const competitions = await prisma.tournament.findMany({
    where: {
      status: { in: ["OPEN", "LOCKED", "IN_PROGRESS"] },
      matches: { some: {} },
    },
    select: { id: true },
    orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
  });

  if (competitions.length === 0) return;

  const existing = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: competitions.map(
          (competition) => COMPETITION_INTRO_STORY_PREFIX + competition.id
        ),
      },
    },
    select: { key: true },
  });
  const existingKeys = new Set(existing.map((setting) => setting.key));

  for (const competition of competitions) {
    const storyKey = COMPETITION_INTRO_STORY_PREFIX + competition.id;
    if (existingKeys.has(storyKey)) continue;

    await generateCompetitionIntroductionStory(competition.id).catch((error) => {
      console.error("Competition introduction story generation failed", {
        tournamentId: competition.id,
        error,
      });
    });
  }
}
