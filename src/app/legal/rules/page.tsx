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
              All predictions must be submitted before the competition-wide deadline, one minute before the tournament&apos;s first kick-off. Once that deadline passes, all predictions are locked and no further entries or changes can be made.
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
                  <strong className="text-[var(--brand-navy)]">Correct winning margin:</strong> 2 bonus points.
                </li>
                <li>
                  <strong className="text-[var(--brand-navy)]">Exact score:</strong> 3 bonus points.
                </li>
              </ul>

              <p>
                An exact score also has the correct outcome and correct margin, so it earns the maximum <strong className="text-[var(--brand-navy)]">6 points</strong> for that match.
              </p>
            </div>
          </Card>

          <Card title="Leaderboard Hierarchy">
            <div className="space-y-5">
              <p>
                The leaderboard is not decided by Points Total alone. If two or more entrants have the same Points Total, Perfect XV works through the following criteria in order until the tie is separated.
              </p>

              <ol className="list-decimal space-y-4 pl-5">
                <li>
                  <strong className="text-[var(--brand-navy)]">Points Total</strong>
                  <p className="mt-1">
                    The entrant with the most points is ranked highest.
                  </p>
                </li>

                <li>
                  <strong className="text-[var(--brand-navy)]">Correct Wins</strong>
                  <p className="mt-1">
                    If Points Total is tied, the entrant who correctly predicted the outcome of more matches ranks higher. This includes correctly predicted draws as well as home and away wins.
                  </p>
                  <p className="mt-1 text-sm">
                    Example: Sean and Mary both have 30 points. Sean has 10 correct outcomes and Mary has 9, so Sean ranks above Mary.
                  </p>
                </li>

                <li>
                  <strong className="text-[var(--brand-navy)]">Perfect Scores</strong>
                  <p className="mt-1">
                    If they are still tied, the entrant with more exact score predictions ranks higher.
                  </p>
                  <p className="mt-1 text-sm">
                    Example: both entrants have 30 points and 10 correct outcomes. One has 3 exact scores and the other has 2, so the entrant with 3 exact scores ranks higher.
                  </p>
                </li>

                <li>
                  <strong className="text-[var(--brand-navy)]">Correct Margins</strong>
                  <p className="mt-1">
                    If the tie remains, the entrant who predicted the exact winning margin more often ranks higher. A correctly predicted draw counts as a margin of zero.
                  </p>
                  <p className="mt-1 text-sm">
                    Example: Ireland win by 7. Predictions of 27-20 and 20-13 both have the correct winning margin of 7, even though neither is the exact score.
                  </p>
                </li>

                <li>
                  <strong className="text-[var(--brand-navy)]">Prediction Delta</strong>
                  <p className="mt-1">
                    If all of the above are still tied, the lowest Prediction Delta ranks higher. Prediction Delta measures how close the predicted winning margins were to the actual winning margins across the tournament, while also distinguishing correct and incorrect match outcomes.
                  </p>
                  <p className="mt-1 text-sm">
                    In simple terms: the lower the Prediction Delta, the better the overall accuracy of the entrant&apos;s predicted margins.
                  </p>
                </li>
              </ol>

              <div className="rounded-lg bg-[var(--brand-soft-lime)] p-4">
                <p className="font-semibold text-[var(--brand-navy)]">
                  If entrants are still tied after all five criteria
                </p>
                <p className="mt-1">
                  They remain jointly ranked. Perfect XV does not introduce an extra tie-breaker beyond Prediction Delta.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
