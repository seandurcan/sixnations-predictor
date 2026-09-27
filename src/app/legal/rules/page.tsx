import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)]">
        <PageHeader
          title="Competition Rules"
          subtitle="Scoring, prediction deadlines, and how leaderboard positions are decided."
          className="mb-8"
        />

        <div className="space-y-6 text-[var(--brand-muted)]">
          <Card title="Prediction Lock">
            <p>
              Predictions lock by competition stage. Every fixture in a stage is predicted before that stage begins, and the whole stage locks one minute before its first kick-off. The Six Nations is one tournament-wide stage. In competitions with later knockout rounds, a new stage opens once its fixtures and teams are known.
            </p>
          </Card>

          <Card title="Points System">
            <div className="space-y-3">
              <p>
                Points are awarded for each completed match:
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-[var(--brand-navy)]">Correct match outcome:</strong> 1 point.
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Exact score:</strong> 0.5 bonus point.
                </li>
              </ul>

              <p>
                An exact score therefore earns <strong className="text-[var(--brand-navy)]">1.5 points</strong> in total for that match. Correct winning margin is retained as a leaderboard tie-break rather than an additional points award.
              </p>
            </div>
          </Card>

          <Card title="Leaderboard Hierarchy">
            <div className="space-y-5">
              <p>
                If two or more entrants have the same Points Total, Perfect XV works through the following criteria in order until the tie is separated.
              </p>

              <ol className="list-decimal space-y-4 pl-5">
                <li>
                  <strong className="text-[var(--brand-navy)]">Points Total</strong>
                  <p className="mt-1">The entrant with the most points is ranked highest.</p>
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Lowest Aggregate Score Error</strong>
                  <p className="mt-1">If Points Total is tied, the entrant whose predicted team scores are closest overall ranks higher.</p>
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Exact Scores</strong>
                  <p className="mt-1">If still tied, the entrant with more exact score predictions ranks higher.</p>
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Correct Winning Margins</strong>
                  <p className="mt-1">If still tied, the entrant with more correctly predicted winning margins ranks higher.</p>
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Correct Results</strong>
                  <p className="mt-1">If still tied, the entrant with more correctly predicted match outcomes ranks higher.</p>
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Total Tournament Points Guess</strong>
                  <p className="mt-1">If the competition is complete and the tie remains, the entrant whose pre-tournament guess is closest to the total points scored across all fixtures ranks higher.</p>
                </li>
              </ol>

              <div className="rounded-lg bg-[var(--brand-soft-lime)] p-4">
                <p className="font-semibold text-[var(--brand-navy)]">If entrants are still tied</p>
                <p className="mt-1">They remain jointly ranked.</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
