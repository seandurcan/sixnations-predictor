import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)]">
        <PageHeader
          title="Terms and Conditions"
          subtitle="Please read these terms carefully before participating in Perfect XV."
          className="mb-8"
        />

        <div className="space-y-6 text-[var(--brand-muted)]">
          <Card title="1. Acceptance of Terms">
            <p>
              By accessing and using Perfect XV, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.
            </p>
          </Card>

          <Card title="2. Competition Rules & Eligibility">
            <p>
              Participants must submit predictions prior to the official kick-off times. Any entry submitted after a fixture locks will be deemed invalid. Decisions made by administrators regarding scoring and leaderboards are final.
            </p>
          </Card>

          <Card title="3. Account Conduct">
            <p>
              Users are responsible for maintaining the confidentiality of their login credentials and for all activities that occur under their account.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}