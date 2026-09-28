"use client";

import { useEffect, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

function Checklist({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-slate-600 text-sm">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
}

export default function AdminDocsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user?.role?.toUpperCase() === "ADMIN") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Failed to verify admin status", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void checkAdmin();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">
        Loading operational documentation...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 p-6">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-4">You do not have administrative privileges to view operational docs.</p>
        <a href="/" className="text-blue-600 underline font-medium">Return to Home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-6 py-12 text-slate-900">
        <PageHeader
          title="Perfect XV Operational Documentation"
          subtitle="Current staging-first deployment, backup, recovery and verification procedures"
          className="mb-8"
        />

        <div className="space-y-8">
          <Card title="1. Environment and Project Map">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                Perfect XV uses separate Vercel projects for staging and production. Treat them as distinct
                environments even when both are connected to the same GitHub repository.
              </p>
              <Checklist items={[
                <><strong className="text-slate-900">Repository:</strong> seandurcan/sixnations-predictor</>,
                <><strong className="text-slate-900">Staging Vercel project:</strong> sixnations-predictor-vercel-ready</>,
                <><strong className="text-slate-900">Production Vercel project:</strong> perfect-xv</>,
                <>The staging branch is used for staging validation. Production must not be updated merely because staging code has been pushed.</>,
                <>Confirm the database and environment-variable target before any destructive or data-changing operation.</>,
              ]} />
            </div>
          </Card>

          <Card title="2. Required Release Sequence">
            <div className="space-y-3">
              <ol className="list-decimal pl-6 space-y-2 text-slate-600 text-sm">
                <li>Make the code change on <strong className="text-slate-900">staging</strong>.</li>
                <li>Allow the staging Vercel deployment to complete.</li>
                <li>Verify the affected workflow on the staging site using real browser behaviour, not code inspection alone.</li>
                <li>Check for build or runtime errors and confirm any relevant calculations against expected values.</li>
                <li>Only after staging is accepted should the same verified state be promoted or merged to production.</li>
                <li>Verify production again after deployment.</li>
              </ol>
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-800">
                <strong>Rule:</strong> staging first. Do not bypass staging for normal feature, scoring,
                documentation or account-management releases.
              </p>
            </div>
          </Card>

          <Card title="3. Build and Database Rules">
            <div className="space-y-3">
              <Checklist items={[
                <>Vercel builds must compile the application; they must not perform ad-hoc scoring repair transactions or other one-off data maintenance.</>,
                <>Database repair scripts are operational tools and must be run deliberately against the intended environment, with a backup and verification plan.</>,
                <>Prisma schema generation is part of the build. Schema migrations are controlled release operations and must target the intended database only.</>,
                <>Never let a staging build mutate the production database.</>,
                <>Do not embed emergency data repair into a normal deployment path to make a build pass.</>,
              ]} />
            </div>
          </Card>

          <Card title="4. Post-Deployment Verification">
            <Checklist items={[
              <>Confirm login, logout, email verification and password reset still work.</>,
              <>Open Predictions and verify the correct competition is selected.</>,
              <>Before lock, verify prediction entry/editing, Quick Pick and the “Time until all predictions lock” countdown.</>,
              <>After completed test results, verify Match Points use 1 + 2 + 3 scoring and an exact score totals 6 points.</>,
              <>Verify Prediction Delta sign and Cumulative Prediction Delta display.</>,
              <>Verify leaderboard totals, ranking and movement after a completed result.</>,
              <>Check Admin Results, Competition Manager, Entrants, Users, Communications and Audit History.</>,
              <>Check Vercel runtime errors after the release.</>,
            ]} />
          </Card>

          <Card title="5. Scoring Integrity Check">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>Current scoring contract:</p>
              <Checklist items={[
                <>Correct result = 1 point.</>,
                <>Correct winning margin = +2 bonus points.</>,
                <>Exact score = +3 bonus points.</>,
                <>Exact score total = 6 points.</>,
                <>Prediction Delta magnitude is the difference between predicted and actual points margins; correct-result predictions display a negative Delta, wrong-result predictions a positive Delta.</>,
                <>Cumulative Prediction Delta is the signed sum across completed matches.</>,
              ]} />
              <p>
                If displayed totals disagree with the scoring contract, stop the release and identify whether
                the fault is in stored data, recalculation logic, API output or UI labelling before changing production.
              </p>
            </div>
          </Card>

          <Card title="6. Database Backup Procedure">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                Maintain regular provider-managed backups of the PostgreSQL database and take an additional
                backup before high-risk data maintenance or migration work.
              </p>
              <Checklist items={[
                <>Confirm the backup belongs to the correct environment.</>,
                <>Record backup time and the release or maintenance operation it precedes.</>,
                <>Where manual dumps are used, store them securely and do not commit them to GitHub.</>,
                <>Periodically verify that a backup can actually be restored.</>,
              ]} />
              <p>
                A command such as <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">pg_dump $DATABASE_URL &gt; backup.sql</code>
                may be used where appropriate, but provider snapshots are preferred when available.
              </p>
            </div>
          </Card>

          <Card title="7. Disaster Recovery">
            <div className="space-y-3 text-slate-600 text-sm">
              <ol className="list-decimal pl-6 space-y-2">
                <li>Stop further writes or place the affected environment into maintenance mode if necessary.</li>
                <li>Identify the last known-good deployment and last verified database backup.</li>
                <li>Restore the database only to the environment it belongs to.</li>
                <li>Confirm Prisma schema compatibility.</li>
                <li>Verify authentication and account access.</li>
                <li>Verify fixtures, predictions, completed results and scoring.</li>
                <li>Verify leaderboard rankings and winner/history data.</li>
                <li>Reopen normal operation only after those checks pass.</li>
              </ol>
            </div>
          </Card>

          <Card title="8. Result and Data Repair">
            <Checklist items={[
              <>Correct a single bad match result through the supported result-correction workflow whenever possible.</>,
              <>Use full score resets only for deliberate testing/reset scenarios, never as a convenient way to fix one fixture.</>,
              <>Before direct SQL or repair scripts, back up and document the intended change.</>,
              <>After repair, verify stored flags, points, CompetitionEntry totals, leaderboard output and audit records as applicable.</>,
              <>Do not run a repair merely because a displayed label is wrong; first determine whether the data or only the UI is incorrect.</>,
            ]} />
          </Card>

          <Card title="9. Email Operations">
            <Checklist items={[
              <>Treat provider/API acceptance and actual mailbox delivery as separate checks.</>,
              <>Verification, password reset, prediction reminders, announcements and locked-prediction confirmations use different workflows and should be tested separately.</>,
              <>Respect unsubscribe and email-preference settings for optional communications.</>,
              <>Before a bulk announcement, verify audience selection, message content and competition context on staging where possible.</>,
            ]} />
          </Card>

          <Card title="10. Stripe and Payment Operations">
            <Checklist items={[
              <>Know whether the current environment is using Stripe test or live credentials.</>,
              <>Test mode must use fictitious test card details only.</>,
              <>Before enabling live payments, verify price, currency, webhook destination and production keys.</>,
              <>If access remains locked after payment, investigate checkout completion, webhook delivery and CompetitionEntry payment status separately.</>,
            ]} />
          </Card>

          <Card title="11. Incident Troubleshooting">
            <Checklist items={[
              <>Record the exact page, account role, competition, time and action that produced the fault.</>,
              <>Check the user-visible message and network/API status where available.</>,
              <>Check the relevant Vercel deployment state and runtime logs.</>,
              <>Compare staging and production before assuming the same code is live in both.</>,
              <>For scoring issues, independently calculate one affected match before changing code.</>,
              <>Make one targeted correction, redeploy to staging, and repeat the same verification path.</>,
            ]} />
          </Card>

          <Card title="12. Production Release Checklist">
            <Checklist items={[
              <>Staging deployment is READY.</>,
              <>Affected staging workflow has been manually verified.</>,
              <>Scoring and leaderboard checks pass if the release touches predictions/results.</>,
              <>No unexpected staging runtime errors remain.</>,
              <>Database migration requirements are understood and backed up.</>,
              <>Production change contains the same verified code, with no unrelated branch drift.</>,
              <>Production deployment reaches READY.</>,
              <>Production smoke test completes successfully.</>,
            ]} />
          </Card>
        </div>
      </main>
    </div>
  );
}
