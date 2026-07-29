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
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="mb-6">
              <StatusBadge status="OPEN" />
            </div>

            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
              Six Nations Predictor
            </h1>

            <p className="mt-6 text-xl text-slate-200 md:text-2xl">
              Predict every match, test your rugby instincts, climb the
              leaderboard, and compete throughout the tournament.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Countdown To The Next Fixture
            </h2>

            <p className="mt-2 text-slate-600">
              Get your predictions submitted before kick-off.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
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
                    <p className="text-slate-600">
                      Round{" "}
                      {nextMatch.round}
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
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
                <p className="text-slate-600">
                  There are no upcoming fixtures available.
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <PageHeader
          title="How It Works"
          subtitle="Simple to enter, easy to follow, competitive until the final whistle."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card title="1. Register">
            <p className="text-slate-600">
              Create your account and get access to your prediction dashboard.
            </p>
          </Card>

          <Card title="2. Predict Scores">
            <p className="text-slate-600">
              Enter your predicted score for each Six Nations fixture before
              kick-off.
            </p>
          </Card>

          <Card title="3. Climb the Table">
            <p className="text-slate-600">
              Earn points, track your ranking, and compete against the rest of
              the leaderboard.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <PageHeader
            title="Competition Features"
            subtitle="Everything you need to follow your progress across the tournament."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card title="Live Dashboard">
              <p className="text-slate-600">
                View your rank, points, movement, prediction progress, and latest result.
              </p>
            </Card>

            <Card title="Predictions">
              <p className="text-slate-600">
                Submit and edit your match predictions while fixtures are still open.
              </p>
            </Card>

            <Card title="Leaderboard">
              <p className="text-slate-600">
                See the full standings, sort by key metrics, and track the top performers.
              </p>
            </Card>

            <Card title="Locked Fixtures">
              <p className="text-slate-600">
                Predictions lock after kick-off to keep the competition fair.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Scoring Overview">
            <div className="space-y-4 text-slate-600">
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

      <section className="bg-green-700 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-4xl font-bold">
            Ready to prove your rugby knowledge?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-green-50">
            Join the Six Nations Predictor, enter your scores, and see how you
            stack up against the competition.
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

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center">
          <p className="font-semibold text-white">
            Six Nations Predictor
          </p>

          <p className="mt-2 text-sm">
            Predict. Compete. Climb the leaderboard.
          </p>
        </div>
      </footer>
    </main>
  );
}