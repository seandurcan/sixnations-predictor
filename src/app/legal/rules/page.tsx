import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)]">
        <PageHeader
          title="Competition Rules"
          subtitle="Scoring matrices, deadlines, and guidelines."
          className="mb-8"
        />

        <div className="space-y-6 text-[var(--brand-muted)]">
          <Card title="Prediction Lock">
            <p>
              All predictions must be submitted before the official kick-off of the tournament. Once the first match has kicked off, all predictions are locked and no further entries or changes can be made.
            </p>
          </Card>

          <Card title="Points System">
            <p>
              Points are awarded as follows: 1 point for the correct match outcome, 2 bonus points for the correct winning margin, and 3 bonus points for the exact score. An exact score therefore earns 6 points in total. Check the instructions page for the complete breakdown.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}