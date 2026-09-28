import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--brand-navy)]">
        <PageHeader
          title="Privacy Policy"
          subtitle="Last updated: September 2026"
          className="mb-8"
        />

        <div className="space-y-6 text-[var(--brand-muted)]">
          <Card title="1. Information We Collect">
            <p>
              We collect information you provide directly when registering an account, making match
              predictions, entering competitions, managing email preferences or otherwise interacting
              with the Perfect XV platform. This includes account details such as your name, email
              address and authentication information, together with competition and prediction data.
            </p>
          </Card>

          <Card title="2. How We Use Your Information">
            <p>
              Your data is used to operate Perfect XV, manage competition entries, calculate scores,
              update leaderboards, provide account support and send relevant platform communications.
            </p>
          </Card>

          <Card title="3. Support Assistant Learning">
            <div className="space-y-3">
              <p>
                Perfect XV may retain questions submitted to the Support Assistant, the likely-help
                option selected and optional helpful/not-helpful feedback so that common wording can
                be interpreted more accurately.
              </p>
              <p>
                Support-learning records are not intentionally linked to your Perfect XV user account
                and do not store a user ID or IP address. Obvious email addresses, long card-like
                numbers and password/CVV-style values are redacted before the question is stored.
                Please do not enter passwords, payment-card information or other unnecessary sensitive
                information into the Support Assistant.
              </p>
              <p>
                Suggested wording-to-topic mappings are reviewed by an administrator before they can
                influence future responses. The Support Assistant cannot automatically change
                competition rules, scoring, prediction locking, leaderboard rules or other approved
                help content.
              </p>
              <p>
                If you mark an answer as not helpful, you may choose to send the question to the
                Perfect XV Helpdesk. In that case, the reply email address you provide, the question
                and the chatbot answer are stored with a helpdesk ticket so an administrator can reply.
                The question is emailed to administrator@perfect-xv.org and the system may also send an
                administrative WhatsApp alert where the WhatsApp Business integration is configured.
              </p>
              <p>
                A helpdesk administrator may approve the clarified reply as future chatbot guidance for
                similar questions. This is a deliberate administrator action and is recorded separately
                from automatic question matching.
              </p>
            </div>
          </Card>

          <Card title="4. Retention">
            <p>
              The Support Assistant keeps a limited rolling set of recent interactions for quality
              review. Older support-learning interactions are removed as newer ones are recorded.
              Other Perfect XV records are retained only as required for operating, administering and
              auditing the service.
            </p>
          </Card>

          <Card title="5. Data Security">
            <p>
              We implement appropriate technical and organisational measures to protect personal data
              and platform records against unauthorised access, loss or alteration.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
