import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)]">
        <PageHeader
          title="Privacy Policy"
          subtitle="Last updated: August 2026"
          className="mb-8"
        />

        <div className="space-y-6 text-[var(--brand-muted)]">
          <Card title="1. Information We Collect">
            <p>
              We collect information you provide directly when registering an account, making match predictions, or interacting with the Perfect XV platform. This includes your name, email address, and authentication credentials.
            </p>
          </Card>

          <Card title="2. How We Use Your Information">
            <p>
              Your data is used strictly to manage your competition entries, calculate scores, update the live leaderboards, and communicate important platform updates regarding matches.
            </p>
          </Card>

          <Card title="3. Data Security">
            <p>
              We implement appropriate technical and organizational measures to secure your personal data against unauthorized access, loss, or alteration.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}