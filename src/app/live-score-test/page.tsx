"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { liveScoreTestFixtures } from "@/lib/liveScoreTestFixtures";

type FixtureState = (typeof liveScoreTestFixtures)[number] & {
  providerMatched: boolean; providerCompetition: string | null; status: string;
  homeScore: number | null; awayScore: number | null; updatedAt: string | null;
};
type ScoreResponse = {
  providerConfigured: boolean; displayTimeZone: string; nextCallAt: number | null;
  fixtures: Record<string, FixtureState>; completed: string[]; unsupported: string[];
  rateRemaining: string | null; lastProviderQueryAt: string | null; lastMessage: string;
};

function FixtureRow({ fixture, state, stopped }: { fixture: (typeof liveScoreTestFixtures)[number]; state?: FixtureState; stopped: boolean }) {
  const hasScore = state?.homeScore != null && state?.awayScore != null;
  return <Card><div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_120px_minmax(280px,1fr)_190px] md:items-center md:gap-6">
    <div><div className="text-xl font-bold">{fixture.home} v {fixture.away}</div><div className="mt-1 text-xs font-semibold uppercase text-[var(--brand-blue)]">{fixture.competition}</div></div>
    <div className="font-semibold text-[var(--brand-muted)]">{fixture.kickoffLabel}</div><div className="text-[var(--brand-muted)]">{fixture.venue}</div>
    <div className="text-left md:text-right">{hasScore && <div className="text-2xl font-black">{state.homeScore} – {state.awayScore}</div>}<div className="font-bold">{state?.status ?? "Scheduled"}</div>{stopped && <div className="text-xs text-[var(--brand-muted)]">Polling stopped</div>}</div>
  </div>{state?.providerMatched && state.providerCompetition && <p className="mt-2 text-xs text-[var(--brand-muted)]">API-Sports competition: {state.providerCompetition}{state.updatedAt && <> · updated {formatIrishTime(state.updatedAt)}</>}</p>}</Card>;
}

function FixtureGroup({ title, fixtures, data }: { title: string; fixtures: typeof liveScoreTestFixtures; data: ScoreResponse | null }) {
  return <section className="mb-8 rounded-xl border border-[var(--brand-border)] p-4"><h2 className="text-xl font-bold">{title}</h2><p className="mb-4 mt-1 text-sm text-[var(--brand-muted)]">Irish time · live-score test</p><div className="space-y-4">{fixtures.map((fixture) => <FixtureRow fixture={fixture} state={data?.fixtures[fixture.id]} stopped={Boolean(data?.completed.includes(fixture.id) || data?.unsupported.includes(fixture.id))} key={fixture.id} />)}</div></section>;
}

function formatIrishTime(value: string | number | null) {
  return value ? new Intl.DateTimeFormat("en-IE", { timeZone: "Europe/Dublin", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value)) : "—";
}

export default function LiveScoreTestPage() {
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const previousScores = useRef<Record<string, string>>({});
  const audioContext = useRef<AudioContext | null>(null);

  const soundAlert = useCallback((fixture: FixtureState) => {
    const context = audioContext.current;
    if (context) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.8);
    }
    navigator.vibrate?.([250, 100, 250]);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Perfect XV score update", { body: `${fixture.home} ${fixture.homeScore} – ${fixture.awayScore} ${fixture.away}` });
    }
  }, []);

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/api/live-score-test", { cache: "no-store" });
      const next = await response.json() as ScoreResponse & { error?: string };
      if (!response.ok) throw new Error(next.error ?? "Unable to load live scores.");
      for (const [id, fixture] of Object.entries(next.fixtures)) {
        const score = fixture.homeScore != null && fixture.awayScore != null ? `${fixture.homeScore}:${fixture.awayScore}` : "";
        const previous = previousScores.current[id];
        if (alertsEnabled && previous && score && previous !== score) soundAlert(fixture);
        previousScores.current[id] = score;
      }
      setData(next); setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load live scores.");
    } finally { setLoading(false); }
  }, [alertsEnabled, soundAlert]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadScores(), 0);
    const interval = window.setInterval(() => void loadScores(), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [loadScores]);

  async function enableAlerts() {
    audioContext.current ??= new AudioContext();
    await audioContext.current.resume();
    if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    setAlertsEnabled(true);
    const oscillator = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    oscillator.frequency.value = 660; gain.gain.value = 0.15;
    oscillator.connect(gain); gain.connect(audioContext.current.destination);
    oscillator.start(); oscillator.stop(audioContext.current.currentTime + 0.25);
  }

  const upcoming = useMemo(() => liveScoreTestFixtures.filter((fixture) => fixture.testSet === "upcoming"), []);
  const completed = useMemo(() => liveScoreTestFixtures.filter((fixture) => fixture.testSet === "completed"), []);
  const november = useMemo(() => liveScoreTestFixtures.filter((fixture) => fixture.testSet === "november"), []);

  return <main className="bg-white py-8 text-[var(--brand-navy)]"><PageContainer>
    <PageHeader title="Live Score Test" subtitle="API-Sports Rugby" className="mb-6" />
    <Card className="mb-6"><p className="font-semibold">Live test mode: this page polls for score changes every 1 minute and stores score updates on the server.</p><p className="mt-2 text-sm text-[var(--brand-muted)]">API-Sports is called at most once per 15-minute match slot. Keep this page open on your phone during a match.</p>
      <button type="button" onClick={() => void enableAlerts()} disabled={alertsEnabled} className="mt-4 rounded-lg bg-[var(--brand-navy)] px-4 py-2 font-semibold text-white disabled:opacity-60">{alertsEnabled ? "Score alerts enabled" : "Enable audible score alerts"}</button>
      {data && <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--brand-muted)]"><span>API-Sports: {data.providerConfigured ? "Configured" : "Not configured"}</span><span>Time zone: {data.displayTimeZone}</span><span>Next fixture: {formatIrishTime(data.nextCallAt)}</span><span>Last provider update: {formatIrishTime(data.lastProviderQueryAt)}</span>{data.rateRemaining && <span>API requests remaining: {data.rateRemaining}</span>}</div>}{data?.lastMessage && <p className="mt-2 text-sm text-[var(--brand-muted)]">{data.lastMessage}</p>}
    </Card>
    {loading && <Card>Loading score state...</Card>}{!loading && error && <Card className="border-red-300 bg-red-50 text-red-700">{error}</Card>}
    {!loading && !error && <><FixtureGroup title="Next monitored fixtures" fixtures={upcoming} data={data} /><FixtureGroup title="Completed live-score tests — Sunday 13 September 2026" fixtures={completed} data={data} /><FixtureGroup title="Nations Championship — November Test" fixtures={november} data={data} /></>}
  </PageContainer></main>;
}
