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
          <Card title="Fixture Lock Times">
            <p>
              All fixtures lock automatically at the scheduled kick-off time. No predictions can be entered or modified after a fixture has locked.
            </p>
          </Card>

          <Card title="Points System">
            <p>
              Points are awarded for correctly guessing match winners/draws and bonus points for exact scoreline matches. Check the instructions page for a complete breakdown.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}