import Link from "next/link";

import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import UserManualPrintButton from "@/components/UserManualPrintButton";

const sections = [
  ["start", "1. Getting started"],
  ["account", "2. Account, verification and password"],
  ["competitions", "3. Choosing a competition"],
  ["payment", "4. Competition entry and payment"],
  ["predictions", "5. Entering and editing predictions"],
  ["locking", "6. Prediction locking"],
  ["quick-pick", "7. Quick Pick"],
  ["results", "8. Predictions after matches begin"],
  ["scoring", "9. Scoring"],
  ["delta", "10. Prediction Delta"],
  ["leaderboard", "11. Leaderboard and ranking"],
  ["fixtures", "12. Fixtures and live results"],
  ["pdf", "13. Prediction PDF and confirmation email"],
  ["invite", "14. Invite friends"],
  ["account-details", "15. Update your details"],
  ["email", "16. Email preferences"],
  ["heritage", "17. Heritage & History"],
] as const;

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-[var(--brand-muted)]">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
}

export default function UserManualPage() {
  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <style>{`
          @media print {
            header, nav, footer { display: none !important; }
            body { background: white !important; }
            main { padding: 0 !important; }
            .manual-brand { display: flex !important; }
            .manual-print-controls { display: none !important; }
            a { color: inherit !important; text-decoration: none !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        <div className="manual-brand mb-6 flex items-center gap-4 border-b border-[var(--brand-border)] pb-4">
          <img src="/images/logo.jpeg" alt="Perfect XV" className="h-16 w-16 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--brand-blue)]">Perfect XV</p>
            <h1 className="text-3xl font-black">User Manual</h1>
          </div>
        </div>

        <UserManualPrintButton />

        <PageHeader
          title="Perfect XV User Manual"
          subtitle="Current guide to registration, competitions, predictions, scoring and account features"
          className="mb-6 print:hidden"
        />

        <Card className="mb-6">
          <p className="text-[var(--brand-muted)]">
            Perfect XV can run more than one prediction competition. Register and verify your account,
            choose the competition you want to enter, complete any required entry payment, then submit
            a score prediction for every fixture before the competition prediction deadline.
          </p>
        </Card>

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
          <section id="start" className="scroll-mt-28">
            <Card title="1. Getting Started">
              <BulletList items={[
                <>Select <strong>Register</strong> if you do not already have an account.</>,
                <>Use an email address you can access. Verification and password-reset messages are sent there.</>,
                <>After verification, log in and use your Dashboard to open competitions, predictions, fixtures and the leaderboard.</>,
                <>If you were invited by another user or administrator, register using the invited email address.</>,
              ]} />
            </Card>
          </section>

          <section id="account" className="scroll-mt-28">
            <Card title="2. Account, Verification and Password">
              <BulletList items={[
                <>A new account must verify its email address before normal use.</>,
                <>If the first verification message is lost or expired, use <strong>Resend Verification Email</strong> on the Login page.</>,
                <>Use <strong>Forgot Password?</strong> to request a password-reset link.</>,
                <>Never create a second account simply because a verification or reset message was missed.</>,
              ]} />
            </Card>
          </section>

          <section id="competitions" className="scroll-mt-28">
            <Card title="3. Choosing a Competition">
              <p className="text-[var(--brand-muted)]">
                Perfect XV supports multiple competitions. Where more than one competition is available,
                use the competition selector on supported pages. Your entry, predictions, leaderboard
                position and results belong to the selected competition.
              </p>
            </Card>
          </section>

          <section id="payment" className="scroll-mt-28">
            <Card title="4. Competition Entry and Payment">
              <BulletList items={[
                <>You may browse the site before entering a competition.</>,
                <>If a competition requires payment, the Predictions page shows <strong>Competition Entry Required</strong> until payment is confirmed.</>,
                <>During test mode, Stripe test payment details may be supplied for testing. No real charge is made in test mode.</>,
                <>After payment is confirmed, prediction entry becomes available automatically.</>,
              ]} />
            </Card>
          </section>

          <section id="predictions" className="scroll-mt-28">
            <Card title="5. Entering and Editing Predictions">
              <BulletList items={[
                <>Enter a home score and away score for each fixture, then save the prediction.</>,
                <>Prediction Progress shows how many fixtures have a saved prediction.</>,
                <>A saved prediction can be selected and edited while predictions remain open.</>,
                <>Complete every fixture before the competition prediction deadline.</>,
              ]} />
            </Card>
          </section>

          <section id="locking" className="scroll-mt-28">
            <Card title="6. Prediction Locking">
              <p className="text-[var(--brand-muted)]">
                All predictions lock <strong>one minute before the first fixture of the competition kicks off</strong>.
                The Predictions page displays <strong>Time until all predictions lock</strong>. Once the deadline
                passes, predictions cannot be entered or changed.
              </p>
            </Card>
          </section>

          <section id="quick-pick" className="scroll-mt-28">
            <Card title="7. Quick Pick">
              <p className="text-[var(--brand-muted)]">
                Quick Pick can generate and save scores for all open fixtures. It is intended to make testing
                and rapid entry easier. Existing predictions may be replaced, so review the generated scores
                before the locking deadline.
              </p>
            </Card>
          </section>

          <section id="results" className="scroll-mt-28">
            <Card title="8. Predictions After Matches Begin">
              <p className="mb-3 text-[var(--brand-muted)]">
                After the competition starts, the Predictions page becomes a results view.
              </p>
              <BulletList items={[
                <>Only completed fixtures are added to the completed-matches list.</>,
                <>Each completed fixture shows the final score, your locked prediction, Match Points and the scoring breakdown.</>,
                <>Total Competition Points are the sum of points from completed matches only.</>,
                <>Your current leaderboard position and latest movement are shown as results are completed.</>,
              ]} />
            </Card>
          </section>

          <section id="scoring" className="scroll-mt-28">
            <Card title="9. Scoring">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead><tr><th className="border p-3">Achievement</th><th className="border p-3">Points</th></tr></thead>
                  <tbody>
                    <tr><td className="border p-3">Correct match result</td><td className="border p-3">1</td></tr>
                    <tr><td className="border p-3">Correct winning margin</td><td className="border p-3">+2</td></tr>
                    <tr><td className="border p-3">Exact score</td><td className="border p-3">+3</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[var(--brand-muted)]">
                Bonuses stack. An exact score therefore earns <strong>6 points</strong>: 1 for the correct
                result, 2 for the correct margin and 3 for the exact score.
              </p>
            </Card>
          </section>

          <section id="delta" className="scroll-mt-28">
            <Card title="10. Prediction Delta">
              <p className="text-[var(--brand-muted)]">
                Prediction Delta measures how far your predicted points difference was from the actual points
                difference. The magnitude is the absolute difference between those two margins. It is shown
                as a <strong>negative value when you predicted the correct result</strong> and as a
                <strong> positive value when you predicted the wrong result</strong>. Cumulative Prediction
                Delta is the signed total across completed matches.
              </p>
            </Card>
          </section>

          <section id="leaderboard" className="scroll-mt-28">
            <Card title="11. Leaderboard and Ranking">
              <p className="mb-3 text-[var(--brand-muted)]">
                Entrants are ranked by <strong>Total Points</strong>. If two or more entrants have the same
                Points Total, Perfect XV works through the following tie-break criteria in order until the tie
                is separated:
              </p>
              <ol className="list-decimal space-y-3 pl-6">
                <li>
                  <strong>Total Points</strong> — the entrant with the most points is ranked highest.
                </li>
                <li>
                  <strong>Lowest Aggregate Score Error</strong> — if Points Total is tied, the entrant whose
                  predicted team scores are closest overall ranks higher.
                </li>
                <li>
                  <strong>Most Exact Scores</strong> — if still tied, the entrant with more exact score
                  predictions ranks higher.
                </li>
                <li>
                  <strong>Most Correct Winning Margins</strong> — if still tied, the entrant with more
                  correctly predicted winning margins ranks higher.
                </li>
                <li>
                  <strong>Most Correct Results</strong> — if still tied, the entrant with more correctly
                  predicted match outcomes ranks higher.
                </li>
                <li>
                  <strong>Closest Total Tournament Points Guess</strong> — once the competition is complete,
                  if the tie remains, the entrant whose pre-tournament guess is closest to the total points
                  scored across all fixtures ranks higher.
                </li>
              </ol>
              <p className="mt-4 text-[var(--brand-muted)]">
                If entrants are still tied after every applicable criterion, they remain jointly ranked.
                Cumulative Prediction Delta is displayed as a separate performance measure and is not the
                Aggregate Score Error tie-break used for leaderboard ranking.
              </p>
            </Card>
          </section>

          <section id="fixtures" className="scroll-mt-28">
            <Card title="12. Fixtures and Live Results">
              <BulletList items={[
                <>Fixtures show teams, rounds, kick-off times and available venue information.</>,
                <>Live-score integration can update an in-play fixture automatically where provider coverage is available.</>,
                <>A fixture is added to completed results only after it is final.</>,
                <>Administrators can correct an official result if a provider result is wrong.</>,
              ]} />
            </Card>
          </section>

          <section id="pdf" className="scroll-mt-28">
            <Card title="13. Prediction PDF and Confirmation Email">
              <p className="text-[var(--brand-muted)]">
                Your Dashboard can provide a private PDF record of your predictions. After predictions lock,
                Perfect XV can also send an email containing your locked predictions so you have an independent
                record of what was submitted.
              </p>
            </Card>
          </section>

          <section id="invite" className="scroll-mt-28">
            <Card title="14. Invite Friends">
              <p className="text-[var(--brand-muted)]">
                Use <strong>Invite Friends to Perfect XV</strong> to send invitations using first name,
                surname and email address. You can add more than one person before sending. Invitations are
                to the site generally; the recipient registers and chooses the competitions they want to enter.
                Duplicate, existing-user and unsubscribed-address safeguards apply.
              </p>
            </Card>
          </section>

          <section id="account-details" className="scroll-mt-28">
            <Card title="15. Update Your Account Details">
              <p className="text-[var(--brand-muted)]">
                Use the account page to review and update the personal account details that Perfect XV allows
                you to maintain yourself. Administrators have separate controlled correction tools for support cases.
              </p>
            </Card>
          </section>

          <section id="email" className="scroll-mt-28">
            <Card title="16. Email Preferences">
              <p className="text-[var(--brand-muted)]">
                Email Preferences controls optional communications and provides unsubscribe choices. Essential
                transactional messages such as verification, password reset or competition-critical notices may
                be treated separately from optional announcements.
              </p>
            </Card>
          </section>

          <section id="heritage" className="scroll-mt-28">
            <Card title="17. Heritage & History">
              <p className="text-[var(--brand-muted)]">
                Heritage & History contains the championship archive, eras, teams, players, records, trophies,
                venues, milestones and classic-match material. It is available as reference content and does not
                affect competition scoring.
              </p>
              <div className="mt-4">
                <Link href="/heritage" className="font-semibold text-[var(--brand-blue)] underline">
                  Open Heritage & History
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
