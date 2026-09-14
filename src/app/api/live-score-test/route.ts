import { NextResponse } from "next/server";
import { liveScoreTestFixtures, type LiveScoreTestFixture } from "@/lib/liveScoreTestFixtures";

export const dynamic = "force-dynamic";

type ScoreState = LiveScoreTestFixture & {
  providerGameId: number | null;
  providerMatched: boolean;
  providerCompetition: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  updatedAt: string | null;
};

type Store = {
  fixtures: Record<string, ScoreState>;
  lastSlots: Record<string, number>;
  lastProviderQueryAt: string | null;
  rateRemaining: string | null;
  lastMessage: string;
};

type ApiGame = {
  id?: number; game?: { id?: number }; teams?: { home?: { name?: string }; away?: { name?: string } };
  home?: string | { name?: string }; away?: string | { name?: string };
  league?: { name?: string }; competition?: { name?: string };
  status?: string | { long?: string; short?: string }; scores?: { home?: number; away?: number };
};

const globalStore = globalThis as typeof globalThis & { perfectXvLiveScoreTest?: Store };

function initialState(fixture: LiveScoreTestFixture): ScoreState {
  const known: Record<string, Partial<ScoreState>> = {
    "southland-bay-of-plenty-2026-09-13": { providerGameId: 53093, providerMatched: true, providerCompetition: "Bunnings NPC", status: "Finished", homeScore: 43, awayScore: 12 },
    "toulouse-bordeaux-2026-09-13": { providerGameId: 54093, providerMatched: true, providerCompetition: "Top 14", status: "Finished", homeScore: 48, awayScore: 12 },
  };
  const unsupported = fixture.testSet === "completed" && !known[fixture.id];
  return {
    ...fixture,
    providerGameId: null,
    providerMatched: false,
    providerCompetition: null,
    status: unsupported ? "Not matched by API-Sports" : "Scheduled",
    homeScore: null,
    awayScore: null,
    updatedAt: unsupported ? "2026-09-13T21:05:10.362Z" : null,
    ...known[fixture.id],
  };
}

function getStore(): Store {
  if (!globalStore.perfectXvLiveScoreTest) {
    globalStore.perfectXvLiveScoreTest = {
      fixtures: Object.fromEntries(liveScoreTestFixtures.map((fixture) => [fixture.id, initialState(fixture)])),
      lastSlots: {}, lastProviderQueryAt: null, rateRemaining: null, lastMessage: "Waiting for the next monitored fixture.",
    };
  }
  for (const fixture of liveScoreTestFixtures) {
    if (!globalStore.perfectXvLiveScoreTest.fixtures[fixture.id]) {
      globalStore.perfectXvLiveScoreTest.fixtures[fixture.id] = initialState(fixture);
    }
  }
  return globalStore.perfectXvLiveScoreTest;
}

function normalise(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function teamMatches(actual: unknown, expected: string, aliases: string[] = []) {
  const candidate = normalise(actual);
  return [expected, ...aliases].some((name) => {
    const wanted = normalise(name);
    return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
  });
}

function dueFixtures(now: number, store: Store) {
  return liveScoreTestFixtures.filter((fixture) => {
    const kickoff = Date.parse(fixture.kickoffIso);
    const withinMatchWindow = now >= kickoff && now <= kickoff + 3 * 60 * 60 * 1000;
    const state = store.fixtures[fixture.id];
    if (!withinMatchWindow || state.status.toLowerCase().includes("finished")) return false;
    const slot = Math.floor(now / (15 * 60 * 1000));
    return store.lastSlots[fixture.id] !== slot;
  });
}

async function updateFromProvider(fixtures: LiveScoreTestFixture[], store: Store) {
  const apiKey = process.env.API_SPORTS_KEY ?? process.env.APISPORTS_RUGBY_KEY ?? process.env.API_RUGBY_KEY;
  if (!apiKey || fixtures.length === 0) return;
  const dates = [...new Set(fixtures.map((fixture) => fixture.date))];
  const now = Date.now();
  const slot = Math.floor(now / (15 * 60 * 1000));

  try {
    for (const date of dates) {
      const response = await fetch(`https://v1.rugby.api-sports.io/games?date=${date}`, {
        headers: { "x-apisports-key": apiKey }, cache: "no-store",
      });
      if (!response.ok) throw new Error(`API-Sports returned ${response.status}.`);
      store.rateRemaining = response.headers.get("x-ratelimit-requests-remaining");
      const payload = await response.json() as { response?: ApiGame[] };
      const games = Array.isArray(payload.response) ? payload.response : [];
      for (const fixture of fixtures.filter((item) => item.date === date)) {
        store.lastSlots[fixture.id] = slot;
        const game = games.find((item) => {
          const home = item.teams?.home?.name ?? (typeof item.home === "object" ? item.home.name : item.home);
          const away = item.teams?.away?.name ?? (typeof item.away === "object" ? item.away.name : item.away);
          return teamMatches(home, fixture.home, fixture.homeAliases) && teamMatches(away, fixture.away, fixture.awayAliases);
        });
        if (!game) continue;
        const current = store.fixtures[fixture.id];
        const homeScore = Number(game.scores?.home);
        const awayScore = Number(game.scores?.away);
        store.fixtures[fixture.id] = {
          ...current,
          providerGameId: Number(game.id ?? game.game?.id) || null,
          providerMatched: true,
          providerCompetition: game.league?.name ?? game.competition?.name ?? fixture.competition,
          status: typeof game.status === "object" ? (game.status.long ?? game.status.short ?? "In progress") : (game.status ?? "In progress"),
          homeScore: Number.isFinite(homeScore) ? homeScore : null,
          awayScore: Number.isFinite(awayScore) ? awayScore : null,
          updatedAt: new Date().toISOString(),
        };
      }
    }
    store.lastProviderQueryAt = new Date().toISOString();
    store.lastMessage = "API-Sports score state updated.";
  } catch (error) {
    store.lastMessage = error instanceof Error ? error.message : "Unable to update API-Sports scores.";
  }
}

export async function GET() {
  const store = getStore();
  const now = Date.now();
  await updateFromProvider(dueFixtures(now, store), store);
  const completed = Object.values(store.fixtures).filter((fixture) => fixture.status.toLowerCase().includes("finished")).map((fixture) => fixture.id);
  const unsupported = Object.values(store.fixtures).filter((fixture) => fixture.status === "Not matched by API-Sports").map((fixture) => fixture.id);
  const nextKickoff = liveScoreTestFixtures.map((fixture) => Date.parse(fixture.kickoffIso)).filter((kickoff) => kickoff > now).sort((a, b) => a - b)[0] ?? null;

  return NextResponse.json({
    providerConfigured: Boolean(process.env.API_SPORTS_KEY ?? process.env.APISPORTS_RUGBY_KEY ?? process.env.API_RUGBY_KEY),
    collectorMode: "page-active", displayTimeZone: "Europe/Dublin", nextCallAt: nextKickoff,
    fixtures: store.fixtures, completed, unsupported, lastSlots: store.lastSlots,
    rateRemaining: store.rateRemaining, lastProviderQueryAt: store.lastProviderQueryAt,
    lastCronRunAt: null, lastMessage: store.lastMessage,
  }, { headers: { "Cache-Control": "no-store" } });
}
