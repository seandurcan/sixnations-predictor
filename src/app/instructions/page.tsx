// @/app/instructions/page.tsx
"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-white relative">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)] bg-white">
        <div className="mb-8">
          <PageHeader
            title="How to Play & Scoring"
            subtitle="Everything you need to know about making predictions and earning points in Perfect XV."
          />
        </div>

        <div className="space-y-8">
          {/* Making Predictions Section */}
          <Card title="Making Your Predictions">
            <div className="space-y-4 text-[var(--brand-muted)]">
              <p>
                Participating in Perfect XV is straightforward. Follow these steps for every fixture in the tournament:
              </p>

              <ol className="list-decimal space-y-3 pl-5">
                <li>
                  <strong className="text-[var(--brand-navy)]">Navigate to Predictions:</strong> Go to the Predictions page from the main navigation menu before kick-off.
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Enter Scores:</strong> Input your predicted score for both the home and away teams for each upcoming fixture.
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Save Changes:</strong> Submit or update your predictions anytime before the match officially kicks off.
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Automatic Locking:</strong> Once kick-off is reached, fixtures lock automatically to ensure a fair competition for all players.
                </li>
              </ol>
            </div>
          </Card>

          {/* Scoring System Section */}
          <Card title="Scoring Breakdown">
            <div className="space-y-4 text-[var(--brand-muted)]">
              <p>
                Points are awarded based on your prediction accuracy, whether you pick the correct match outcome, and how close your exact score guesses are.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="rounded-lg bg-[rgba(0,123,255,0.04)] p-4 border border-[rgba(0,123,255,0.15)]">
                  <h4 className="font-bold text-[var(--brand-navy)] mb-1">Correct Outcome</h4>
                  <p className="text-sm">Earn base points for correctly predicting which team wins or if the match ends in a draw.</p>
                </div>

                <div className="rounded-lg bg-[var(--brand-soft-lime)] p-4 border border-emerald-200">
                  <h4 className="font-bold text-[var(--brand-navy)] mb-1">Exact Score Bonus</h4>
                  <p className="text-sm">Get maximum points by nailing the exact scoreline for both teams, separating top predictors on the table.</p>
                </div>
              </div>

              <ul className="list-disc space-y-2 pl-5 pt-2">
                <li>Points differential tracks how close your score predictions are overall across the tournament.</li>
                <li>Climb the live leaderboard automatically as match results are finalized and processed by admins.</li>
              </ul>
            </div>
          </Card>

          {/* Quick Action Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => {
                window.location.href = "/predictions";
              }}
            >
              Make Predictions Now
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Go To Dashboard
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="footer" className="bg-white text-[var(--brand-muted)] border-t border-[var(--brand-border)] px-6 py-8 text-center mt-16">
        <p className="font-semibold text-[var(--brand-navy)]">
          Perfect XV
        </p>

        <p className="mt-2 text-sm">
          Analyse. Predict. Win.
        </p>
      </footer>
    </div>
  );
}