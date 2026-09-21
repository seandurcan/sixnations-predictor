// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { syncLiveScores, applyMatchScore, POLL_INTERVAL_MS } from "./liveScoring";
import { prisma } from "./prisma";

vi.mock("@/lib/currentTournament", () => ({
  getCurrentTournament: async () => ({ id: 1 }),
}));

vi.mock("./prisma", () => ({ prisma: {
  match: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  user: { findFirst: vi.fn() },
  scoreAudit: { create: vi.fn() },
  systemSetting: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(), $executeRaw: vi.fn(),
} }));
const kickoff = Date.parse("2026-09-14T14:00:00Z");
const match = { id: 1, kickoffTime: new Date(kickoff), completed: false,
  homeTeam: { name: "Ireland" }, awayTeam: { name: "France" }, actualHomeScore: null, actualAwayScore: null };
let settings: Map<string, string>;
describe("live polling budget and override", () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(kickoff);
    vi.stubEnv("API_SPORTS_KEY", "test-key");
    settings = new Map();
    vi.mocked(prisma.match.findMany).mockResolvedValue([match] as never);
    vi.mocked(prisma.match.findUnique).mockResolvedValue(match as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 99 } as never);
    vi.mocked(prisma.systemSetting.findUnique).mockImplementation((async ({ where }: any) => settings.has(where.key) ? { key: where.key, value: settings.get(where.key) } : null) as never);
    vi.mocked(prisma.systemSetting.create).mockImplementation((async ({ data }: any) => {
      if (settings.has(data.key)) throw Object.assign(new Error("duplicate"), { code: "P2002" });
      settings.set(data.key, data.value); return data;
    }) as never);
    vi.mocked(prisma.systemSetting.updateMany).mockImplementation((async ({ where, data }: any) => {
      if (settings.get(where.key) !== where.value) return { count: 0 };
      settings.set(where.key, data.value); return { count: 1 };
    }) as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: [] }) }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it.each([-1, 150 * 60 * 1000 + 1])("suppresses provider calls outside active window (%i)", async (offset) => {
    vi.setSystemTime(kickoff + offset);
    expect((await syncLiveScores()).providerQueries).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("polls at kickoff, not at 29.999 seconds, and again at 30 seconds", async () => {
    expect(POLL_INTERVAL_MS).toBe(30000);
    expect((await syncLiveScores()).providerQueries).toBe(1);
    vi.setSystemTime(kickoff + 29999);
    expect((await syncLiveScores()).providerQueries).toBe(0);
    vi.setSystemTime(kickoff + 30000);
    expect((await syncLiveScores()).providerQueries).toBe(1);
  });
  it("allows the 30-minute grace after the two-hour expected window", async () => {
    vi.setSystemTime(kickoff + 150 * 60 * 1000);
    expect((await syncLiveScores()).providerQueries).toBe(1);
  });
  it("suppresses completed matches and manual overrides", async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValue([{ ...match, completed: true }] as never);
    expect((await syncLiveScores()).providerQueries).toBe(0);
    vi.mocked(prisma.match.findMany).mockResolvedValue([match] as never);
    settings.set("LIVE_SCORE_OVERRIDE_1", "true");
    expect((await syncLiveScores()).providerQueries).toBe(0);
  });
  it("only one concurrent caller claims the first request", async () => {
    await Promise.all([syncLiveScores(), syncLiveScores(), syncLiveScores()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("resumes an Admin full-time correction when override is explicitly removed", async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValue([{ ...match, completed: true }] as never);
    settings.set("LIVE_SCORE_META_1", JSON.stringify({ source: "ADMIN" }));
    settings.set("LIVE_SCORE_OVERRIDE_1", "true");
    expect((await syncLiveScores()).providerQueries).toBe(0);
    settings.set("LIVE_SCORE_OVERRIDE_1", "false");
    expect((await syncLiveScores()).providerQueries).toBe(1);
  });
  it("only one concurrent caller claims the next request", async () => {
    settings.set("LIVE_SCORE_SLOT_1", String(kickoff - 30000));
    await Promise.all([syncLiveScores(), syncLiveScores()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("counts and throttles unsuccessful provider attempts", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    expect((await syncLiveScores()).providerQueries).toBe(1);
    expect((await syncLiveScores()).providerQueries).toBe(0);
  });
  it("ignores missing provider scores instead of writing a false 0-0", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ response: [{ teams: { home: match.homeTeam, away: match.awayTeam }, scores: { home: null, away: null } }] }) } as Response);
    await syncLiveScores();
    expect(prisma.match.update).not.toHaveBeenCalled();
  });
  it("rejects an API write if Admin enabled override while fetch was in flight", async () => {
    settings.set("LIVE_SCORE_OVERRIDE_1", "true");
    const result = await applyMatchScore({ matchId: 1, homeScore: 3, awayScore: 0, completed: false, source: "API-Sports", adminUserId: 99 });
    expect(result.skipped).toBe(true);
    expect(prisma.scoreAudit.create).not.toHaveBeenCalled();
    expect(prisma.match.update).not.toHaveBeenCalled();
  });
});
