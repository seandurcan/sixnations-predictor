"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const sections = [
  ["role", "1. Administrator role and access"],
  ["overview", "2. Admin area overview"],
  ["dashboard", "3. Admin Dashboard"],
  ["results", "4. Entering match results"],
  ["corrections", "5. Correcting a result"],
  ["testing", "6. Tournament testing controls"],
  ["reset", "7. Reset All Game Scores"],
  ["communications", "8. Communications"],
  ["reminders", "9. Reminder administration"],
  ["verification", "10. Verification email problems"],
  ["payments", "11. Payments and prediction access"],
  ["scoring", "12. Scoring and leaderboard checks"],
  ["completion", "13. Tournament completion and winners"],
  ["audit", "14. Audit History"],
  ["data", "15. Tournament and fixture data"],
  ["operations", "16. Deployment, backups and recovery"],
  ["production", "17. Production versus testing"],
  ["troubleshooting", "18. Troubleshooting checklist"],
  ["eventday", "19. Match-day administration"],
  ["support", "20. Supporting entrants"],
] as const;

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border border-[var(--brand-border)] px-3 py-2 font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-soft-lime)]"
    >
      {children}
    </a>
  );
}

function Note({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
      <p className="font-bold text-[var(--brand-navy)]">{title}</p>
      <div className="mt-2 text-[var(--brand-muted)]">{children}</div>
    </div>
  );
}

function Warning({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-slate-800">
      <strong>Important: </strong>
      {children}
    </div>
  );
}

function Checklist({
  items,
}: {
  items: string[];
}) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-[var(--brand-muted)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
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
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!active) {
          return;
        }

        if (!response.ok) {
          window.location.href = "/login";
          return;
        }

        const result = await response.json();

        if (
          result.authenticated &&
          result.user?.role?.toUpperCase() === "ADMIN"
        ) {
          setIsAdmin(true);
          return;
        }

        window.location.href = "/dashboard";
      } catch (error) {
        console.error(
          "Administration Manual access check failed:",
          error
        );
        window.location.href = "/login";
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkAdmin();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageContainer>
          <Card>Checking administrator access...</Card>
        </PageContainer>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Perfect XV Administration Manual"
          subtitle="Operational guide for site administrators"
          className="mb-6"
        />

        <Card className="mb-6">
          <p className="text-lg">
            This manual covers the routine tasks required to operate
            Perfect XV safely during testing and during the Six Nations
            competition. It should be read together with the normal
            User Manual so that an administrator understands the site
            exactly as entrants see it.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/admin/dashboard">
              <Button fullWidth>Admin Dashboard</Button>
            </Link>
            <Link href="/admin">
              <Button fullWidth>Admin Results</Button>
            </Link>
            <Link href="/admin/communications">
              <Button fullWidth>Communications</Button>
            </Link>
            <Link href="/admin/audit">
              <Button fullWidth>Audit</Button>
            </Link>
            <Link href="/user-manual">
              <Button fullWidth variant="secondary">
                User Manual
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Contents" className="mb-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(([id, label]) => (
              <SectionLink key={id} href={`#${id}`}>
                {label}
              </SectionLink>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <section id="role" className="scroll-mt-28">
            <Card title="1. Administrator Role and Access">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  An administrator has access to tournament operations
                  that normal entrants do not have. Admin access is
                  determined by the account role. Admin-only pages
                  redirect a non-admin user away from the protected
                  area.
                </p>

                <Checklist
                  items={[
                    "Use an administrator account only for administration work.",
                    "Do not share administrator login details.",
                    "Use the normal User Manual when checking the entrant experience.",
                    "Use the Admin menu for operational work.",
                    "Confirm which environment you are working in before making changes.",
                  ]}
                />

                <Warning>
                  Result entry, score reset and reminder controls can
                  affect every entrant. Check the page and environment
                  before pressing an administrative action.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="overview" className="scroll-mt-28">
            <Card title="2. Admin Area Overview">
              <div className="grid gap-4 md:grid-cols-2">
                <Note title="Admin Dashboard">
                  Overview of users, matches remaining, completed
                  matches and players with predictions.
                </Note>

                <Note title="Admin Results">
                  Select fixtures, enter official results, recalculate
                  entrant scoring and use the testing controls.
                </Note>

                <Note title="Communications">
                  Send verification and prediction reminders, preview
                  reminder emails and manage automatic reminders.
                </Note>

                <Note title="Audit History">
                  Review result changes, including previous score, new
                  score and the administrator responsible.
                </Note>

                <Note title="Operational Docs">
                  Internal deployment, backup and disaster-recovery
                  notes.
                </Note>

                <Note title="Administration Manual">
                  This guide. It is available from the Admin menu only
                  to administrator accounts.
                </Note>
              </div>
            </Card>
          </section>

          <section id="dashboard" className="scroll-mt-28">
            <Card title="3. Admin Dashboard">
              <p className="mb-4 text-[var(--brand-muted)]">
                The Admin Dashboard is the first operational health
                check. Review it before entering scores or sending
                communications.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <Note title="Total Users">
                  Number of active users counted by the dashboard.
                </Note>
                <Note title="Matches Remaining">
                  Fixtures still remaining for the active tournament.
                </Note>
                <Note title="Completed Matches">
                  Matches the system currently regards as completed.
                </Note>
                <Note title="Players with Predictions">
                  Number of active players who have predictions in the
                  tournament.
                </Note>
              </div>

              <p className="mt-4 text-[var(--brand-muted)]">
                If a dashboard figure is obviously inconsistent with
                the known tournament state, investigate it before
                using the figure for decisions. Do not manually alter
                production data merely to make a dashboard number look
                correct.
              </p>
            </Card>
          </section>

          <section id="results" className="scroll-mt-28">
            <Card title="4. Entering Match Results">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Use <strong>Admin Results</strong> to record the
                  official final score for a fixture.
                </p>

                <Checklist
                  items={[
                    "Confirm the correct fixture before entering a score.",
                    "Confirm the match is final and the official score is known.",
                    "Enter the home-team score and away-team score in the correct fields.",
                    "Save the result once only and wait for the success message.",
                    "Check the fixture now shows the saved result.",
                    "Check the leaderboard and entrant dashboards after scoring.",
                  ]}
                />

                <p>
                  Saving a result marks the fixture completed, records
                  an audit entry, calculates every prediction for that
                  match, refreshes user totals and creates a new
                  leaderboard snapshot.
                </p>

                <Warning>
                  Never use a provisional score, half-time score or
                  score taken from an unconfirmed source as the final
                  result.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="corrections" className="scroll-mt-28">
            <Card title="5. Correcting a Result">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  If an incorrect result was entered, select the same
                  fixture in Admin Results and enter the correct final
                  score. Saving it creates another audit record and
                  recalculates scoring from the corrected result.
                </p>

                <Checklist
                  items={[
                    "Record what was wrong before changing it.",
                    "Verify the corrected official result.",
                    "Save the corrected home and away scores.",
                    "Open Audit History and confirm the old and new scores are recorded.",
                    "Check leaderboard order and affected entrant totals.",
                  ]}
                />

                <Warning>
                  Do not use Reset All Game Scores to correct one
                  fixture. Reset is a tournament testing/recovery
                  operation, not a normal result-correction tool.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="testing" className="scroll-mt-28">
            <Card title="6. Tournament Testing Controls">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Admin Results contains testing controls for
                  Tournament 1. <strong>Complete Next Test Game</strong>
                  applies one fixed test result at a time, allowing the
                  full scoring and leaderboard flow to be exercised.
                </p>

                <Checklist
                  items={[
                    "Use test scoring only when intentionally testing tournament behaviour.",
                    "Watch the Test Games Scored counter as each fixture is completed.",
                    "After each test score, verify leaderboard movement and entrant statistics.",
                    "Use all 15 test games only when an end-to-end tournament completion test is intended.",
                  ]}
                />

                <Warning>
                  Do not use the test-game controls during the live
                  competition.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="reset" className="scroll-mt-28">
            <Card title="7. Reset All Game Scores">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  <strong>Reset All Game Scores</strong> resets the
                  scoring state for Tournament 1 while retaining
                  entrants and their saved predictions.
                </p>

                <p>The reset currently clears or resets:</p>

                <Checklist
                  items={[
                    "actual match scores and completed flags",
                    "calculated prediction scoring fields",
                    "user scoring totals",
                    "leaderboard snapshots",
                    "TournamentWinner records",
                    "score audit history for Tournament 1",
                    "the admin test-scoring-active setting",
                    "tournament status back to OPEN",
                  ]}
                />

                <Warning>
                  This is a destructive administrative action. During
                  a real competition, do not run it merely to fix an
                  isolated mistake.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="communications" className="scroll-mt-28">
            <Card title="8. Communications">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Open Communications from Admin Results. The page
                  manages verification and prediction reminder
                  messages.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <Note title="Send Verification Reminders">
                    Sends a manual reminder campaign to eligible
                    unverified entrants.
                  </Note>
                  <Note title="Send Prediction Reminders">
                    Sends a manual reminder campaign to eligible
                    entrants who still require prediction reminders.
                  </Note>
                  <Note title="Preview Verification Email">
                    Review the verification-reminder presentation
                    before a live send.
                  </Note>
                  <Note title="Preview Prediction Email">
                    Review the prediction-reminder presentation before
                    a live send.
                  </Note>
                </div>

                <p>
                  The page also displays the number of verification
                  and prediction reminders currently due and provides
                  the automatic-reminder control.
                </p>
              </div>
            </Card>
          </section>

          <section id="reminders" className="scroll-mt-28">
            <Card title="9. Reminder Administration">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  The Communications page currently presents automatic
                  reminders as a weekly Saturday 09:00 process and
                  allows the feature to be turned ON or OFF.
                </p>

                <Checklist
                  items={[
                    "Preview email content before important campaigns.",
                    "Check the due counts before a manual send.",
                    "After sending, confirm the operation reports how many emails were sent.",
                    "Check actual delivery when testing; an API success does not guarantee the message appears in the Inbox.",
                    "Keep temporary reminder-testing controls separate from normal automatic reminders.",
                  ]}
                />

                <Warning>
                  Repeated manual sends can cause duplicate messages or
                  harm deliverability. Use repeated-send testing only
                  inside the temporary testing window.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="verification" className="scroll-mt-28">
            <Card title="10. Verification Email Problems">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  When an entrant says a verification message was not
                  received, separate <strong>sending</strong> from
                  <strong>delivery</strong>.
                </p>

                <Checklist
                  items={[
                    "Confirm the entrant registered with the intended email address.",
                    "Ask the entrant to check Spam, Junk, Updates and Trash as well as Inbox.",
                    "Use Resend Verification Email from the Login page when appropriate.",
                    "Check application logs for a successful Resend message ID or an email-send error.",
                    "If Resend accepted the message but the user cannot see it, investigate mailbox filtering and sender reputation rather than repeatedly changing the registration code.",
                  ]}
                />

                <p>
                  The production sender is
                  <strong> noreply@perfect-xv.org</strong>. Delivery
                  testing should include at least one external mailbox
                  provider before launch.
                </p>
              </div>
            </Card>
          </section>

          <section id="payments" className="scroll-mt-28">
            <Card title="11. Payments and Prediction Access">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Entrants may register, verify, log in and browse the
                  site without paying. Payment is enforced when they
                  open Predictions. An unpaid entrant sees the
                  Competition Entry Required notice and chooses
                  <strong> Continue to Payment</strong>.
                </p>

                <Note title="Real competition fee">
                  The intended live competition entry fee is
                  <strong> &euro;20</strong>.
                </Note>

                <Note title="Current Stripe testing fee">
                  The current Stripe checkout amount is
                  <strong> &euro;5</strong> for testing. Do not treat
                  that as the live competition price.
                </Note>

                <p>
                  Prediction writes are protected server-side. An
                  unpaid account must not be able to bypass the payment
                  page by calling the prediction API directly.
                </p>

                <Checklist
                  items={[
                    "Before going live, change the Stripe charge from the test amount to the real EUR 20 entry fee.",
                    "Confirm Stripe is in the intended test or live mode.",
                    "Confirm checkout success and cancel URLs use https://perfect-xv.org.",
                    "Confirm the Stripe webhook sends checkout.session.completed to /api/stripe/webhook.",
                    "Confirm STRIPE_WEBHOOK_SECRET in production matches the active Stripe webhook destination.",
                    "Complete a real end-to-end test before accepting entrants.",
                  ]}
                />

                <Warning>
                  A successful card screen is not enough. Perfect XV
                  unlocks Predictions only after the payment status is
                  confirmed in the application.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="scoring" className="scroll-mt-28">
            <Card title="12. Scoring and Leaderboard Checks">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>The scoring rule is:</p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[var(--brand-border)]">
                    <thead>
                      <tr className="bg-[var(--brand-soft-blue)]">
                        <th className="border border-[var(--brand-border)] p-3 text-left">
                          Outcome
                        </th>
                        <th className="border border-[var(--brand-border)] p-3 text-left">
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-[var(--brand-border)] p-3">
                          Correct result/winner
                        </td>
                        <td className="border border-[var(--brand-border)] p-3">
                          1
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-[var(--brand-border)] p-3">
                          Exact score
                        </td>
                        <td className="border border-[var(--brand-border)] p-3">
                          4 total: 1 correct-result point plus 3 exact-score bonus
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-[var(--brand-border)] p-3">
                          Incorrect result
                        </td>
                        <td className="border border-[var(--brand-border)] p-3">
                          0
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  Correct Winning Margin is a ranking statistic, not an
                  additional point. Aggregate Score Error is the sum
                  of the absolute prediction error for both teams over
                  completed matches.
                </p>

                <p>The ranking hierarchy is:</p>
                <ol className="list-decimal space-y-1 pl-6 font-semibold text-[var(--brand-navy)]">
                  <li>Total Points</li>
                  <li>Correct Results</li>
                  <li>Exact Scores</li>
                  <li>Correct Winning Margins</li>
                  <li>Lowest Aggregate Score Error</li>
                </ol>

                <p>
                  Entrants still tied after all five criteria remain
                  joint-ranked.
                </p>
              </div>
            </Card>
          </section>

          <section id="completion" className="scroll-mt-28">
            <Card title="13. Tournament Completion and Winners">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  When all tournament fixtures are completed, the
                  result-processing route marks the tournament
                  COMPLETED and stores all rank-1 entrants as
                  TournamentWinner records.
                </p>

                <p>
                  Prize positions use the 3:2:1 ratio. If two entrants
                  are joint winners, first and second prize are pooled
                  and divided equally. If three or more entrants are
                  joint winners, the first three prizes are pooled and
                  divided equally between those joint winners.
                </p>

                <Checklist
                  items={[
                    "Confirm all 15 official results are present.",
                    "Confirm the leaderboard has recalculated after the final result.",
                    "Confirm any joint rank is genuine under all five ranking criteria.",
                    "Confirm winner records and prize calculation before publishing or paying prizes.",
                  ]}
                />
              </div>
            </Card>
          </section>

          <section id="audit" className="scroll-mt-28">
            <Card title="14. Audit History">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Audit History records administrative changes to match
                  results. Each entry shows the date, match, previous
                  score, new score and administrator responsible.
                </p>

                <p>
                  Use the audit after corrections and whenever a score
                  discrepancy is reported. The page is paginated.
                </p>

                <Warning>
                  The Tournament 1 test reset intentionally clears the
                  Tournament 1 score audit history. Do not rely on test
                  audit records as permanent production evidence.
                </Warning>
              </div>
            </Card>
          </section>

          <section id="data" className="scroll-mt-28">
            <Card title="15. Tournament and Fixture Data">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  The active Six Nations tournament depends on
                  Tournament ID 1 and 15 fixtures in correct
                  chronological order. The current admin interface
                  does not provide a general fixture/tournament master
                  data editor.
                </p>

                <Checklist
                  items={[
                    "Before launch, verify Tournament 1 is the intended championship.",
                    "Verify exactly 15 fixtures exist for Tournament 1.",
                    "Verify teams, dates, kick-off times, rounds and ordering.",
                    "Treat direct production-database edits as controlled maintenance, not routine admin work.",
                    "Back up before any manual data repair.",
                  ]}
                />
              </div>
            </Card>
          </section>

          <section id="operations" className="scroll-mt-28">
            <Card title="16. Deployment, Backups and Recovery">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Operational Docs contains the existing deployment,
                  backup and disaster-recovery notes. Use it alongside
                  this manual.
                </p>

                <Checklist
                  items={[
                    "Keep production and test databases separate.",
                    "Back up the production PostgreSQL database regularly.",
                    "Run database migrations before a production build when migrations are part of the release.",
                    "After deployment, verify login, authentication, Predictions, leaderboard and admin pages.",
                    "After a database restore, verify schema compatibility and scoring before reopening normal operation.",
                  ]}
                />

                <div className="mt-4">
                  <Link href="/admin/docs">
                    <Button variant="secondary">
                      Open Operational Docs
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          <section id="production" className="scroll-mt-28">
            <Card title="17. Production Versus Testing">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Perfect XV testing must not be allowed to contaminate
                  the live competition.
                </p>

                <Checklist
                  items={[
                    "Know whether the current deployment is production or a test/reference deployment.",
                    "Know which database the deployment is using.",
                    "Do not run Complete Next Test Game on live competition data.",
                    "Do not leave test-only Quick Pick or payment assumptions undocumented when preparing for launch.",
                    "Verify real Stripe pricing, live/test keys and webhook destination before accepting real payments.",
                    "Run Reset All Game Scores only when the consequences are intended and understood.",
                  ]}
                />
              </div>
            </Card>
          </section>

          <section id="troubleshooting" className="scroll-mt-28">
            <Card title="18. Troubleshooting Checklist">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  When something fails, identify the failing stage
                  before changing code.
                </p>

                <Checklist
                  items={[
                    "Reproduce the problem once and record the exact page, time and action.",
                    "Check the browser-visible message and HTTP status where available.",
                    "Check Vercel runtime logs for the relevant route and time.",
                    "For email, distinguish API acceptance from mailbox delivery.",
                    "For Stripe, distinguish checkout creation, card completion, webhook delivery and account-status update.",
                    "For scoring, verify the stored official result before investigating the leaderboard.",
                    "For access problems, verify authentication and role before changing page logic.",
                    "Make one targeted correction, deploy it and retest the same path.",
                  ]}
                />
              </div>
            </Card>
          </section>

          <section id="eventday" className="scroll-mt-28">
            <Card title="19. Match-Day Administration">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>For each live fixture:</p>

                <Checklist
                  items={[
                    "Before kick-off, verify the fixture details and that entrant access behaves as expected.",
                    "Do not alter predictions on behalf of entrants.",
                    "After full time, obtain the confirmed official result.",
                    "Enter the result once in Admin Results.",
                    "Confirm Result Saved.",
                    "Open the leaderboard and check the new snapshot/ranking behaviour.",
                    "Check Audit History for the result entry.",
                    "If a correction is required, correct that fixture only and verify the audit trail.",
                  ]}
                />
              </div>
            </Card>
          </section>

          <section id="support" className="scroll-mt-28">
            <Card title="20. Supporting Entrants">
              <div className="space-y-4 text-[var(--brand-muted)]">
                <p>
                  Administrators also need to understand the entrant
                  journey. The normal User Manual remains available to
                  admin accounts from the profile menu.
                </p>

                <Checklist
                  items={[
                    "Use the User Manual when answering registration, verification, payment and prediction-entry questions.",
                    "Do not ask entrants for passwords.",
                    "Do not manually alter a prediction to resolve a support issue.",
                    "For payment problems, verify payment state and webhook processing rather than bypassing payment enforcement.",
                    "For verification problems, use the resend flow and delivery checks.",
                  ]}
                />

                <div className="mt-4">
                  <Link href="/user-manual">
                    <Button variant="secondary">
                      Open User Manual
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
