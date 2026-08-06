import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)]">
        <PageHeader
          title="Cookie Policy"
          subtitle="Understand how we use cookies and session storage."
          className="mb-8"
        />

        <div className="space-y-6 text-[var(--brand-muted)]">
          <Card title="What Are Cookies">
            <p>
              Cookies are small data files stored on your device that help us keep you logged in and remember your preferences across sessions.
            </p>
          </Card>

          <Card title="How We Use Cookies">
            <p>
              We use authentication and session cookies to verify your identity when you access secure features like your dashboard and predictions panel.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}