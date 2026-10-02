import {
  discoverCompetitionFixtures,
  validateFixturePreview,
  type FixturePreview,
  type FixturePreviewResult,
} from "@/lib/fixtureDiscovery";
import {
  discoverOfficialCompetitionFixtures,
  supportsOfficialFixtureDiscovery,
} from "@/lib/officialFixtureDiscovery";

export type FixtureDiscoveryAttempt = {
  source: "API_SPORTS" | "OFFICIAL_OR_PUBLISHED" | "AI_WEB";
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  message: string;
};

export type AutomatedFixtureDiscoveryResult = FixturePreviewResult & {
  discoveryMode: "AUTOMATIC";
  selectedSource: FixtureDiscoveryAttempt["source"];
  attempts: FixtureDiscoveryAttempt[];
  sourceUrls?: string[];
};

type AiFixturePayload = {
  sourceName?: string;
  sourceUrls?: string[];
  fixtures?: Array<{
    round?: number | null;
    kickoffTime?: string | null;
    homeTeam?: string | null;
    awayTeam?: string | null;
    venue?: string | null;
    city?: string | null;
    country?: string | null;
  }>;
};

function outputText(payload: unknown) {
  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (typeof response.output_text === "string") return response.output_text;
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function parseJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "");
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("AI fixture research returned no JSON object.");
  return JSON.parse(cleaned.slice(first, last + 1)) as AiFixturePayload;
}

function cleanText(value: unknown, max = 160) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

function normaliseAiFixtures(payload: AiFixturePayload, competitionName: string) {
  const fixtures: FixturePreview[] = (payload.fixtures ?? []).map((fixture) => {
    const kickoff =
      typeof fixture.kickoffTime === "string" &&
      !Number.isNaN(new Date(fixture.kickoffTime).getTime())
        ? new Date(fixture.kickoffTime).toISOString()
        : null;
    const home = cleanText(fixture.homeTeam, 120);
    const away = cleanText(fixture.awayTeam, 120);

    return {
      providerGameId: null,
      round:
        Number.isInteger(fixture.round) && Number(fixture.round) > 0
          ? Number(fixture.round)
          : null,
      kickoffTime: kickoff,
      homeTeam: home,
      awayTeam: away,
      providerHomeTeam: home ?? "",
      providerAwayTeam: away ?? "",
      venue: cleanText(fixture.venue),
      city: cleanText(fixture.city, 120),
      country: cleanText(fixture.country, 120),
    };
  }).filter((fixture) => fixture.homeTeam || fixture.awayTeam);

  const unique = Array.from(
    new Map(
      fixtures.map((fixture) => [
        `${fixture.homeTeam}|${fixture.awayTeam}|${fixture.kickoffTime}`,
        fixture,
      ])
    ).values()
  ).sort((a, b) => String(a.kickoffTime).localeCompare(String(b.kickoffTime)));

  const validation = validateFixturePreview(unique, competitionName);
  const participantTeams = Array.from(
    new Set(
      unique
        .flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
        .filter((team): team is string => Boolean(team))
    )
  ).sort((a, b) => a.localeCompare(b));

  return { fixtures: unique, validation, participantTeams };
}

async function discoverWithAiWeb(
  competitionName: string,
  year: number,
  apiKey: string
): Promise<FixturePreviewResult & { sourceUrls: string[] }> {
  const model = process.env.OPENAI_FIXTURE_MODEL?.trim() || "gpt-6-luna";
  const prompt = [
    "Find the published rugby fixtures for the named competition and season.",
    "Search the competition organiser or governing body's official website first.",
    "If the official site does not expose a usable full schedule, use a reputable published rugby fixture source and cross-check it.",
    "Do not invent fixtures, teams, dates, kickoff times, venues or locations.",
    "Only include fixtures that are explicitly supported by the sources you find.",
    "Return ONLY a JSON object with this shape:",
    '{"sourceName":"...","sourceUrls":["https://..."],"fixtures":[{"round":1,"kickoffTime":"2027-10-01T10:45:00Z","homeTeam":"Team A","awayTeam":"Team B","venue":"Stadium","city":"City","country":"Country"}]}',
    "kickoffTime must be a valid ISO-8601 timestamp including an offset or Z.",
    `Competition: ${competitionName}`,
    `Season/year: ${year}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      tools: [{ type: "web_search" }],
      store: false,
      max_output_tokens: 12000,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      `AI web fixture research returned HTTP ${response.status}${detail ? `: ${detail}` : ""}.`
    );
  }

  const payload = await response.json();
  const parsed = parseJsonObject(outputText(payload));
  const normalised = normaliseAiFixtures(parsed, competitionName);
  if (normalised.fixtures.length === 0) {
    throw new Error("AI web fixture research did not return any usable fixtures.");
  }

  const sourceUrls = Array.from(
    new Set(
      (parsed.sourceUrls ?? [])
        .filter((url): url is string => typeof url === "string" && /^https?:\/\//i.test(url))
        .map((url) => url.slice(0, 500))
    )
  );

  return {
    provider: "Official / Online",
    providerLeague: {
      id: 0,
      name: cleanText(parsed.sourceName, 180) ?? "AI-assisted published fixture research",
    },
    fixtures: normalised.fixtures,
    participantTeams: normalised.participantTeams,
    warnings: [
      "AI-assisted fixture extraction was used only after the normal providers failed. Review every fixture and source before approving the import.",
      ...normalised.validation.warnings,
    ],
    valid: normalised.validation.valid,
    expectedFixtureCount: normalised.fixtures.length,
    discoveredFixtureCount: normalised.fixtures.length,
    competitionKind: "LEAGUE",
    queryDiagnostics: [
      `AI web research model: ${model}`,
      ...sourceUrls.map((url) => `Source: ${url}`),
    ],
    sourceUrls,
  };
}

function annotate(
  preview: FixturePreviewResult,
  selectedSource: FixtureDiscoveryAttempt["source"],
  attempts: FixtureDiscoveryAttempt[],
  sourceUrls?: string[]
): AutomatedFixtureDiscoveryResult {
  return {
    ...preview,
    discoveryMode: "AUTOMATIC",
    selectedSource,
    attempts,
    sourceUrls,
    queryDiagnostics: [
      ...attempts.map(
        (attempt) =>
          `${attempt.source}: ${attempt.status.toLowerCase()} — ${attempt.message}`
      ),
      ...(preview.queryDiagnostics ?? []),
    ],
  };
}

export async function discoverFixturesAutomatically(args: {
  competitionName: string;
  year: number;
  apiSportsKey?: string | null;
  openAiKey?: string | null;
}): Promise<AutomatedFixtureDiscoveryResult> {
  const attempts: FixtureDiscoveryAttempt[] = [];

  if (args.apiSportsKey) {
    try {
      const preview = await discoverCompetitionFixtures(
        args.competitionName,
        args.year,
        args.apiSportsKey
      );
      if (preview.fixtures.length > 0) {
        attempts.push({
          source: "API_SPORTS",
          status: "SUCCESS",
          message: `${preview.fixtures.length} fixture(s) found.`,
        });
        return annotate(preview, "API_SPORTS", attempts);
      }
      attempts.push({
        source: "API_SPORTS",
        status: "FAILED",
        message: "No fixtures returned.",
      });
    } catch (error) {
      attempts.push({
        source: "API_SPORTS",
        status: "FAILED",
        message: error instanceof Error ? error.message : "Provider lookup failed.",
      });
    }
  } else {
    attempts.push({
      source: "API_SPORTS",
      status: "SKIPPED",
      message: "API-Sports key is not configured.",
    });
  }

  if (supportsOfficialFixtureDiscovery(args.competitionName)) {
    try {
      const preview = await discoverOfficialCompetitionFixtures(
        args.competitionName,
        args.year
      );
      if (preview.fixtures.length > 0) {
        attempts.push({
          source: "OFFICIAL_OR_PUBLISHED",
          status: "SUCCESS",
          message: `${preview.fixtures.length} fixture(s) found.`,
        });
        return annotate(preview, "OFFICIAL_OR_PUBLISHED", attempts);
      }
      attempts.push({
        source: "OFFICIAL_OR_PUBLISHED",
        status: "FAILED",
        message: "No fixtures returned.",
      });
    } catch (error) {
      attempts.push({
        source: "OFFICIAL_OR_PUBLISHED",
        status: "FAILED",
        message: error instanceof Error ? error.message : "Official source lookup failed.",
      });
    }
  } else {
    attempts.push({
      source: "OFFICIAL_OR_PUBLISHED",
      status: "SKIPPED",
      message: "No dedicated official-site adapter is registered; AI web research will look for the official site first.",
    });
  }

  if (args.openAiKey) {
    try {
      const preview = await discoverWithAiWeb(
        args.competitionName,
        args.year,
        args.openAiKey
      );
      attempts.push({
        source: "AI_WEB",
        status: "SUCCESS",
        message: `${preview.fixtures.length} fixture(s) found from published web sources.`,
      });
      return annotate(
        preview,
        "AI_WEB",
        attempts,
        preview.sourceUrls
      );
    } catch (error) {
      attempts.push({
        source: "AI_WEB",
        status: "FAILED",
        message: error instanceof Error ? error.message : "AI web research failed.",
      });
    }
  } else {
    attempts.push({
      source: "AI_WEB",
      status: "SKIPPED",
      message: "OPENAI_API_KEY is not configured.",
    });
  }

  throw new Error(
    [
      `No automatic fixture source produced a usable schedule for ${args.competitionName} ${args.year}.`,
      ...attempts.map(
        (attempt) => `${attempt.source}: ${attempt.status.toLowerCase()} — ${attempt.message}`
      ),
      "You can still use the CSV / Excel fixture import.",
    ].join(" ")
  );
}
