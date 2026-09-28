"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const sections = [
  ["access", "1. Access and responsibilities"],
  ["dashboard", "2. Admin Dashboard"],
  ["competitions", "3. Competition Manager"],
  ["fixtures", "4. Fixture discovery and import"],
  ["entrants", "5. Competition entrants"],
  ["users", "6. User management"],
  ["duplicates", "7. Duplicate-account review"],
  ["corrections", "8. Controlled account corrections"],
  ["communications", "9. Communications and delivery"],
  ["reminders", "10. Verification and prediction reminders"],
  ["results", "11. Match results and live scoring"],
  ["scoring", "12. Scoring and leaderboard checks"],
  ["completion", "13. Competition completion and prizes"],
  ["audit", "14. Audit History"],
  ["testing", "15. Testing controls"],
  ["operations", "16. Deployment and operations"],
  ["matchday", "17. Match-day checklist"],
] as const;

function Checklist({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-[var(--brand-muted)]">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
}

export default function AdministrationManualPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkAdmin() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (!active) return;
        if (!response.ok) {
          window.location.href = "/login";
          return;
        }
        const result = await response.json();
        if (result.authenticated && result.user?.role?.toUpperCase() === "ADMIN") {
          setIsAdmin(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void checkAdmin();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">Loading Administration Manual...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-slate-900">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-4">Administrator access is required.</p>
        <a href="/" className="text-blue-600 underline font-medium">Return to Home</a>
      </div>
    );
  }

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Perfect XV Administration Manual"
          subtitle="Current operating guide for competition, entrant, result, communication and account administration"
          className="mb-6"
        />

        <Card title="Contents" className="mb-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-lg border border-[var(--brand-border)] px-3 py-2 font-semibold text-[var(--brand-blue)] hover:bg-[var(--brand-soft-lime)]">
                {label}
              </a>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <section id="access" className="scroll-mt-28">
            <Card title="1. Access and Responsibilities">
              <Checklist items={[
                <>Use administrator tools only for authorised Perfect XV administration.</>,
                <>Do not ask users for passwords or alter a user&apos;s prediction to solve a support issue.</>,
                <>Use the controlled account-correction and duplicate-review workflows instead of direct database editing wherever possible.</>,
                <>Treat destructive actions, account deletion, result corrections and resets as deliberate audited operations.</>,
              ]} />
            </Card>
          </section>

          <section id="dashboard" className="scroll-mt-28">
            <Card title="2. Admin Dashboard">
              <p className="text-[var(--brand-muted)]">
                The Admin area links to competition management, entrants, users, communications, results,
                audit history, documentation and testing controls. Confirm the selected competition before
                taking any competition-specific action.
              </p>
            </Card>
          </section>

          <section id="competitions" className="scroll-mt-28">
            <Card title="3. Competition Manager">
              <Checklist items={[
                <>Create and maintain annual competitions independently rather than assuming one fixed tournament.</>,
                <>The competition name should not include the year; the year is stored separately.</>,
                <>When creating a new annual competition, the year defaults to the next appropriate year and remains editable.</>,
                <>Check status, entry fee, currency, first kick-off and prediction-lock timing before opening entry.</>,
                <>Do not make a competition live until fixtures and readiness checks are complete.</>,
              ]} />
            </Card>
          </section>

          <section id="fixtures" className="scroll-mt-28">
            <Card title="4. Fixture Discovery and Import">
              <Checklist items={[
                <>Use official/provider fixture discovery where coverage is available.</>,
                <>Use CSV/manual import when provider discovery is incomplete or unavailable.</>,
                <>Always review the preview before import and validate each fixture&apos;s teams, date, kick-off time, round, venue and ordering.</>,
                <>Reject duplicate or obviously incomplete fixtures rather than repairing them after launch.</>,
                <>After import, verify the full fixture count and chronological sequence on the public Fixtures page.</>,
              ]} />
            </Card>
          </section>

          <section id="entrants" className="scroll-mt-28">
            <Card title="5. Competition Entrants">
              <Checklist items={[
                <>Entrant membership is competition-specific.</>,
                <>Add an existing account directly where appropriate, or send an invitation to a new participant.</>,
                <>Imported entrant lists must be normalised and deduplicated.</>,
                <>Withdraw removes participation from the active entrant list without deleting account history; Restore reverses a withdrawal where permitted.</>,
                <>Use entrant status to review verification, payment and prediction progress.</>,
              ]} />
            </Card>
          </section>

          <section id="users" className="scroll-mt-28">
            <Card title="6. User Management">
              <Checklist items={[
                <>Use the user manager for account support, status review and controlled administration.</>,
                <>Read-only administrative access must remain read-only where that role is assigned.</>,
                <>Account deletion is currently permitted for genuine administrative cases such as deceased users; confirm the account carefully before deletion.</>,
                <>Users can update supported account details themselves from their account page.</>,
              ]} />
            </Card>
          </section>

          <section id="duplicates" className="scroll-mt-28">
            <Card title="7. Controlled Duplicate-Account Review">
              <p className="text-[var(--brand-muted)]">
                Review suspected duplicate accounts using the dedicated workflow. Record the classification
                decision in Audit History. A duplicate classification is not the same thing as an automatic
                merge and must not silently discard competition, payment or prediction history.
              </p>
            </Card>
          </section>

          <section id="corrections" className="scroll-mt-28">
            <Card title="8. Controlled Account Corrections">
              <p className="text-[var(--brand-muted)]">
                Use Controlled User Account Corrections for administrator-assisted changes. Confirm the user,
                the old value and the requested replacement before saving. Account-support changes should be
                auditable and should never expose passwords, reset tokens or verification tokens.
              </p>
            </Card>
          </section>

          <section id="communications" className="scroll-mt-28">
            <Card title="9. Communications and Delivery">
              <Checklist items={[
                <>Use Competition Communications for announcements and controlled bulk delivery.</>,
                <>Review the target competition, audience, subject and message before sending.</>,
                <>Respect unsubscribe and email-preference settings for optional communications.</>,
                <>Do not treat provider acceptance as proof of mailbox delivery; investigate delivery separately where needed.</>,
                <>Historic contact lists must be handled as legacy data and should not be confused with active registered entrants.</>,
              ]} />
            </Card>
          </section>

          <section id="reminders" className="scroll-mt-28">
            <Card title="10. Verification and Prediction Reminders">
              <Checklist items={[
                <>Verification reminders are for registered accounts that still require email verification.</>,
                <>Prediction reminders are based on outstanding predictions and stop once predictions lock.</>,
                <>The planned reminder sequence begins in advance of lock, becomes more frequent near the deadline and includes a final near-lock reminder.</>,
                <>After lock, entrants who submitted predictions can receive an email copy of their locked predictions.</>,
              ]} />
            </Card>
          </section>

          <section id="results" className="scroll-mt-28">
            <Card title="11. Match Results and Live Scoring">
              <Checklist items={[
                <>Where live-score coverage is available, scores can update automatically.</>,
                <>A match must not be treated as completed until the result is final.</>,
                <>Use Admin Results to enter or correct an official result manually when required.</>,
                <>After a result change, verify the Predictions results view, leaderboard totals, ranking movement and Audit History.</>,
                <>Correct only the affected fixture; do not use a full reset to repair one score.</>,
              ]} />
            </Card>
          </section>

          <section id="scoring" className="scroll-mt-28">
            <Card title="12. Scoring and Leaderboard Checks">
              <p className="mb-3 text-[var(--brand-muted)]">Current scoring is fixed at:</p>
              <Checklist items={[
                <>1 point for the correct match result.</>,
                <>+2 bonus points for the correct winning margin.</>,
                <>+3 bonus points for an exact score.</>,
                <>Maximum 6 points for one exact-score prediction.</>,
                <>Cumulative Prediction Delta is the signed sum of match Prediction Delta values and is displayed for entrant feedback/audit.</>,
              ]} />
              <p className="mt-4 text-[var(--brand-muted)]">Current leaderboard comparator:</p>
              <ol className="list-decimal space-y-1 pl-6 font-semibold">
                <li>Total Points</li>
                <li>Lowest Aggregate Score Error</li>
                <li>Most Exact Scores</li>
                <li>Most Correct Winning Margins</li>
                <li>Most Correct Results</li>
              </ol>
            </Card>
          </section>

          <section id="completion" className="scroll-mt-28">
            <Card title="13. Competition Completion and Prizes">
              <Checklist items={[
                <>Confirm every fixture is final before closing a competition.</>,
                <>Verify the final leaderboard and any joint positions before publishing winners.</>,
                <>Prize allocation uses the 3:2:1 split.</>,
                <>Two joint winners share first and second prize; three or more joint winners share the top three prizes equally.</>,
                <>Keep winner and historical leaderboard records available for later reference/download.</>,
              ]} />
            </Card>
          </section>

          <section id="audit" className="scroll-mt-28">
            <Card title="14. Audit History">
              <p className="text-[var(--brand-muted)]">
                Audit History is the read-only record of important administrative actions, including result
                changes and controlled account-support actions. Use filters to investigate who changed what
                and when. Sensitive secrets such as passwords and tokens must never be exposed there.
              </p>
            </Card>
          </section>

          <section id="testing" className="scroll-mt-28">
            <Card title="15. Testing Controls">
              <Checklist items={[
                <>Use testing controls only against staging/test data.</>,
                <>Quick Pick and fictitious Stripe payments may be used during testing.</>,
                <>A score reset must restore the pre-match prediction-entry state and must never be run against live production unintentionally.</>,
                <>After a reset, verify Quick Pick, countdown and prediction entry return as expected.</>,
              ]} />
            </Card>
          </section>

          <section id="operations" className="scroll-mt-28">
            <Card title="16. Deployment and Operations">
              <Checklist items={[
                <>Deploy changes to staging first.</>,
                <>Verify the affected workflow on staging before production promotion.</>,
                <>Do not perform database-repair transactions as part of a normal Vercel build.</>,
                <>Keep migrations, environment variables and database targets controlled and documented.</>,
                <>After deployment, check authentication, Predictions, leaderboard, admin pages and runtime errors.</>,
              ]} />
              <div className="mt-4">
                <Link href="/admin/docs"><Button variant="secondary">Open Operational Docs</Button></Link>
              </div>
            </Card>
          </section>

          <section id="matchday" className="scroll-mt-28">
            <Card title="17. Match-Day Checklist">
              <Checklist items={[
                <>Before kick-off, confirm fixture time, teams and live-score readiness.</>,
                <>Confirm predictions are locked at the competition deadline.</>,
                <>During play, monitor provider updates and only intervene if data is clearly wrong.</>,
                <>At full time, verify the final score and completion status.</>,
                <>Check entrant Match Points, Cumulative Prediction Delta and leaderboard movement.</>,
                <>If a correction is required, correct the single fixture and recheck the audit trail.</>,
              ]} />
              <div className="mt-4">
                <Link href="/user-manual"><Button variant="secondary">Open User Manual</Button></Link>
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
