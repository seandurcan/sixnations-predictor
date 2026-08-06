"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CountdownTimer from "@/components/ui/CountdownTimer";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatIrishDate } from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [nextMatch, setNextMatch] =
    useState<any>(null);

  const [loadingNextMatch, setLoadingNextMatch] =
    useState(true);

  useEffect(() => {
    loadNextMatch();
  }, []);

  async function loadNextMatch() {
    try {
      const response =
        await fetch("/api/matches");

      if (!response.ok) {
        setNextMatch(null);
        return;
      }

      const matches =
        await response.json();

      const upcomingMatches =
        matches.filter(
          (match: any) =>
            !match.completed &&
            match.kickoffTime
        );

      const sortedUpcomingMatches =
        [...upcomingMatches].sort(
          (a: any, b: any) =>
            new Date(
              a.kickoffTime
            ).getTime() -
            new Date(
              b.kickoffTime
            ).getTime()
        );

      setNextMatch(
        sortedUpcomingMatches[0] ?? null
      );
    } catch (error) {
      console.error(
        "Failed to load next match",
        error
      );

      setNextMatch(null);
    } finally {
      setLoadingNextMatch(false);
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Page container: Centered main content wrapper */}
      <main className="mx-auto max-w-6xl text-[var(--brand-navy)] bg-white">
        <section className="border-b border-[var(--brand-border)] bg-white">
          <div className="grid gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            <div id="hero-left-column">
              <div id="status-badge-open" className="mb-6">
                <StatusBadge status="OPEN" />
              </div>

              <h1 id="perfect-xv-heading" className="text-5xl font-black tracking-tight text-[var(--brand-navy)] md:text-7xl">
                Perfect{" "}
                <span className="text-[var(--brand-lime)]">
                  XV
                </span>
              </h1>

              <p id="tagline" className="mt-4 text-2xl font-bold text-[var(--brand-blue)] md:text-3xl">
                Analyse. Predict.{" "}
                <span className="text-[var(--brand-orange)]">
                  Win.
                </span>
              </p>

              <p id="hero-description" className="mt-6 max-w-2xl text-xl text-[var(--brand-muted)] md:text-2xl">
                Predict every match, test your rugby instincts, climb the
                leaderboard, and compete throughout the tournament.
              </p>

              <div id="cta-button-row" className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={() => {
                    window.location.href =
                      "/register";
                  }}
                >
                  Create Account
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    window.location.href =
                      "/login";
                  }}
                >
                  Login
                </Button>
              </div>
            </div>

            <Card id="tournament-predictor-card" className="border-[rgba(0,123,255,0.22)] bg-[rgba(0,123,255,0.04)]">
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
                  Tournament Predictor
                </p>

                <h2 className="text-3xl font-black text-[var(--brand-navy)]">
                  Where predictions become points.
                </h2>

                <p className="text-[var(--brand-muted)]">
                  Enter your scores before kick-off, track every result, and see
                  where you stand as the table changes.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div id="pill-predict" className="rounded-lg bg-white p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-[var(--brand-blue)]">
                      XV
                    </p>

                    <p className="text-xs font-semibold uppercase text-[var(--brand-muted)]">
                      Predict
                    </p>
                  </div>

                  <div id="pill-climb" className="rounded-lg bg-[var(--brand-soft-lime)] p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-[var(--brand-navy)]">
                      ↑
                    </p>

                    <p className="text-xs font-semibold uppercase text-[var(--brand-navy)]">
                      Climb
                    </p>
                  </div>

                  <div id="pill-win" className="rounded-lg bg-[var(--brand-soft-orange)] p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-[var(--brand-orange)]">
                      Win
                    </p>

                    <p className="text-xs font-semibold uppercase text-[var(--brand-orange)]">
                      Compete
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="countdown-section-header" className="border-b bg-white">
          <div className="px-6 py-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Countdown To The Six Nations Championship 2027
              </h2>

              <p className="mt-2 text-[var(--brand-muted)]">
              </p>
            </div>

            <div id="match-card-container" className="mx-auto mt-8 max-w-2xl">
              {loadingNextMatch ? (
                <Card>
                  Loading next fixture...
                </Card>
              ) : nextMatch ? (
                <Card
                  title={`${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}`}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-[var(--brand-muted)]">
                        Round{" "}
                        {nextMatch.round}
                      </p>

                      <p className="mt-1 font-semibold text-[var(--brand-navy)]">
                        {formatIrishDate(
                          nextMatch.kickoffTime
                        )}
                      </p>
                    </div>

                    <CountdownTimer
                      targetDate={
                        nextMatch.kickoffTime
                      }
                      label="Time until kick-off"
                    />

                    <Button
                      fullWidth
                      onClick={() => {
                        window.location.href =
                          "/predictions";
                      }}
                    >
                      Make Your Prediction
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card title="Tournament Complete">
                  <p className="text-[var(--brand-muted)]">
                    There are no upcoming fixtures available.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works-section" className="px-6 py-16">
          <PageHeader
            title="How It Works"
            subtitle="Simple to enter, easy to follow, competitive until the final whistle."
          />

          <div className="grid gap-6 md:grid-cols-3">
            <Card title="1. Register">
              <p className="text-[var(--brand-muted)]">
                Create your account and get access to your prediction dashboard.
              </p>
            </Card>

            <Card title="2. Predict Scores">
              <p className="text-[var(--brand-muted)]">
                Enter your predicted score for each Six Nations fixture before
                kick-off.
              </p>
            </Card>

            <Card title="3. Climb the Table">
              <p className="text-[var(--brand-muted)]">
                Earn points, track your ranking, and compete against the rest of
                the leaderboard.
              </p>
            </Card>
          </div>
        </section>

        <section id="competition-features-section" className="border-y bg-white">
          <div className="px-6 py-16">
            <PageHeader
              title="Competition Features"
              subtitle="Everything you need to follow your progress across the tournament."
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card title="Live Dashboard">
                <p className="text-[var(--brand-muted)]">
                  View your rank, points, movement, prediction progress, and latest result.
                </p>
              </Card>

              <Card title="Predictions">
                <p className="text-[var(--brand-muted)]">
                  Submit and edit your match predictions while fixtures are still open.
                </p>
              </Card>

              <Card title="Leaderboard">
                <p className="text-[var(--brand-muted)]">
                  See the full standings, sort by key metrics, and track the top performers.
                </p>
              </Card>

              <Card title="Locked Fixtures">
                <p className="text-[var(--brand-muted)]">
                  Predictions lock after kick-off to keep the competition fair.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section id="scoring-and-access-section" className="px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Scoring Overview">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Points are awarded based on prediction accuracy, correct outcomes,
                  and exact score performance.
                </p>

                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Predict each fixture score before kick-off.
                  </li>

                  <li>
                    Earn points when your prediction is correct.
                  </li>

                  <li>
                    Exact scores help separate the best predictors.
                  </li>

                  <li>
                    Points differential tracks how close your score predictions are overall.
                  </li>
                </ul>
              </div>
            </Card>

            <Card title="Quick Access">
              <div className="grid gap-3">
                <Button
                  fullWidth
                  onClick={() => {
                    window.location.href =
                      "/dashboard";
                  }}
                >
                  Go To Dashboard
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => {
                    window.location.href =
                      "/predictions";
                  }}
                >
                  Make Predictions
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => {
                    window.location.href =
                      "/leaderboard";
                  }}
                >
                  View Leaderboard
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <section id="bottom-cta-section" className="bg-[var(--brand-navy)] text-white -mx-6 px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold">
              Ready to prove your rugby knowledge?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Join Perfect XV, enter your scores, and see how you stack up
              against the competition.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                onClick={() => {
                  window.location.href =
                    "/register";
                }}
              >
                Register Now
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  window.location.href =
                    "/login";
                }}
              >
                Login
              </Button>
            </div>
          </div>
        </section>

        <footer id="footer" className="bg-white text-[var(--brand-muted)] border-t border-[var(--brand-border)] px-6 py-8 text-center">
          <p className="font-semibold text-[var(--brand-navy)]">
            Perfect XV
          </p>

          <p className="mt-2 text-sm">
            Analyse. Predict. Win.
          </p>
        </footer>
      </main>
    </div>
  );
}