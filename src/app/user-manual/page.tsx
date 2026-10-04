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
  ["locking", "6. Prediction locking and reminders"],
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
  ["news", "17. News by competition"],
  ["heritage", "18. Heritage & History"],
  ["support", "19. Perfect XV Support Chatbot"],
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
              <BulletList items={[
                <>Perfect XV supports multiple competitions. Where more than one competition is available, use the competition selector on supported pages.</>,
                <>The <strong>current competition</strong> is the active competition with the soonest first kick-off. Other active/future competitions follow in chronological order; completed competitions remain available as history where the page supports them.</>,
                <>Your entry, predictions, leaderboard position, results, News and downloadable leaderboard belong to the competition you have selected.</>,
              ]} />
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
            <Card title="6. Prediction Locking and Reminders">
              <BulletList items={[
                <>For the Six Nations and other tournament-wide prediction competitions, all predictions lock <strong>one minute before the first fixture kicks off</strong>.</>,
                <>Competitions with later knockout participants, such as the Rugby World Cup or Challenge Cup, can use stage-based locking: the known pool/regular stage locks one minute before that stage begins, and later knockout stages receive their own deadline when those fixtures are known.</>,
                <>The Predictions page displays the relevant countdown. Once a deadline passes, predictions covered by that deadline cannot be entered or changed.</>,
                <>Outstanding-prediction reminders begin about four weeks before the first kick-off, then repeat at three weeks, two weeks and one week.</>,
                <>The final reminder is scheduled for <strong>exactly two hours before the first kick-off</strong>. If you complete all required predictions before it is sent, Perfect XV cancels that scheduled final prediction reminder.</>,
              ]} />
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
              <p className="mb-3 text-[var(--brand-muted)]">
                Prediction Delta compares the <strong>points difference (winning margin)</strong> in your
                prediction with the points difference in the actual result. First calculate the size of the
                difference between those two margins. Perfect XV then gives that number a sign:
                <strong> negative when you predicted the correct result</strong> and
                <strong> positive when you predicted the wrong result</strong>.
              </p>

              <p className="mb-4 text-[var(--brand-muted)]">
                In simple terms: <strong>Delta magnitude = |actual margin − predicted margin|</strong>.
                The sign is then applied according to whether the predicted winner, loser or draw was correct.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="border p-3">Situation</th>
                      <th className="border p-3">Actual Result</th>
                      <th className="border p-3">Prediction</th>
                      <th className="border p-3">Calculation</th>
                      <th className="border p-3">Prediction Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-3">Correct winner, close margin</td>
                      <td className="border p-3">Ireland 27–20 England — margin 7</td>
                      <td className="border p-3">Ireland 24–20 England — margin 4</td>
                      <td className="border p-3">|7 − 4| = 3</td>
                      <td className="border p-3"><strong>−3</strong></td>
                    </tr>
                    <tr>
                      <td className="border p-3">Correct winner, exact margin</td>
                      <td className="border p-3">France 30–23 Wales — margin 7</td>
                      <td className="border p-3">France 24–17 Wales — margin 7</td>
                      <td className="border p-3">|7 − 7| = 0</td>
                      <td className="border p-3"><strong>0</strong></td>
                    </tr>
                    <tr>
                      <td className="border p-3">Correct winner, larger margin difference</td>
                      <td className="border p-3">Scotland 21–18 Italy — margin 3</td>
                      <td className="border p-3">Scotland 30–20 Italy — margin 10</td>
                      <td className="border p-3">|3 − 10| = 7</td>
                      <td className="border p-3"><strong>−7</strong></td>
                    </tr>
                    <tr>
                      <td className="border p-3">Winner not predicted correctly</td>
                      <td className="border p-3">Wales 14–20 Ireland — margin 6</td>
                      <td className="border p-3">Wales 18–15 Ireland — margin 3</td>
                      <td className="border p-3">|6 − 3| = 3</td>
                      <td className="border p-3"><strong>+3</strong></td>
                    </tr>
                    <tr>
                      <td className="border p-3">Correctly predicted draw</td>
                      <td className="border p-3">England 17–17 France — margin 0</td>
                      <td className="border p-3">England 20–20 France — margin 0</td>
                      <td className="border p-3">|0 − 0| = 0</td>
                      <td className="border p-3"><strong>0</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-5 text-lg font-bold text-[var(--brand-navy)]">How Cumulative Prediction Delta is calculated</h3>
              <p className="mt-2 text-[var(--brand-muted)]">
                Perfect XV adds the signed Prediction Delta from every completed match. For example, if your
                first four completed matches produce <strong>−3, −7, +3 and 0</strong>, your Cumulative
                Prediction Delta is <strong>−3 + −7 + 3 + 0 = −7</strong>. It is a running total, so every
                completed result can change it.
              </p>

              <h3 className="mt-5 text-lg font-bold text-[var(--brand-navy)]">Why Prediction Delta matters</h3>
              <p className="mt-2 text-[var(--brand-muted)]">
                Prediction Delta does not replace Match Points. It is used as the <strong>fifth leaderboard
                tie-break</strong>, after Points Total, Correct Wins, Perfect Scores and Correct Margins. If
                entrants are still tied after those four measures, the entrant with the
                <strong> lower Cumulative Prediction Delta</strong> ranks higher. It therefore provides an
                additional signed comparison of how the entrants&apos; predicted margins differed from the
                actual completed-match margins.
              </p>
            </Card>
          </section>

          <section id="leaderboard" className="scroll-mt-28">
            <Card title="11. Leaderboard and Ranking">
              <p className="mb-3 text-[var(--brand-muted)]">
                Perfect XV uses the following ranking criteria in this exact order:
              </p>
              <ol className="list-decimal space-y-3 pl-6">
                <li><strong>Points Total</strong> — highest total ranks first.</li>
                <li><strong>Correct Wins</strong> — most correctly predicted match outcomes ranks higher. Correctly predicted draws count as correct outcomes.</li>
                <li><strong>Perfect Scores</strong> — most exact score predictions ranks higher.</li>
                <li><strong>Correct Margins</strong> — most correctly predicted winning margins ranks higher.</li>
                <li><strong>Prediction Delta</strong> — lowest cumulative Prediction Delta ranks higher.</li>
              </ol>
              <p className="mt-4 text-[var(--brand-muted)]">
                Prediction Delta is negative when the predicted result is correct and positive when it is
                wrong. The cumulative total keeps those signs. If entrants are still equal after all five
                criteria, they remain jointly ranked.
              </p>
              <p className="mt-3 text-[var(--brand-muted)]">
                Where more than one competition is available, select the competition first. <strong>Download Leaderboard PDF</strong>
                downloads the full leaderboard for that selected competition, not merely the page currently visible on screen.
              </p>
            </Card>
          </section>

          <section id="fixtures" className="scroll-mt-28">
            <Card title="12. Fixtures and Live Results">
              <p className="mb-3 text-[var(--brand-muted)]">
                Fixtures show the teams, round, kick-off time and available venue information. Once a match
                reaches kick-off, Perfect XV can use its live-score provider to follow the match automatically
                where provider coverage is available.
              </p>
              <BulletList items={[
                <>After kick-off, Perfect XV checks the live-score feed periodically for the current score and match status.</>,
                <>While the match is in progress, the displayed score may change as the provider reports new scoring events. An in-play score does <strong>not</strong> yet count as a completed result for competition scoring.</>,
                <>When the provider marks the match as finished, Perfect XV records the final score, marks the fixture complete and recalculates the affected predictions and leaderboard information.</>,
                <>The completed fixture then appears in the completed-matches results shown to entrants.</>,
                <>Live scores depend on provider coverage and may be slightly behind events at the ground.</>,
                <>If the provider is unavailable or reports an incorrect score, an administrator can enter or correct the result manually. A manual override prevents an automatic provider update from immediately overwriting the correction; automatic updates can later be resumed by an administrator.</>,
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
              <p className="mb-3 text-[var(--brand-muted)]">
                Email Preferences controls optional Perfect XV announcements. Account-security and essential
                service messages, such as verification and password-reset emails, are not controlled by the
                optional-announcement preference.
              </p>
              <BulletList items={[
                <>Optional announcement emails contain an <strong>Unsubscribe from optional announcements</strong> link near the bottom of the email.</>,
                <>Select that link to open the Perfect XV unsubscribe page, then select <strong>Confirm unsubscribe</strong>.</>,
                <>After confirmation, optional announcement emails are switched off for your account. Essential account-security and service emails are not affected.</>,
                <>If you later change your mind, open <strong>Email Preferences</strong> while signed in and select <strong>Opt Back In</strong>.</>,
              ]} />
            </Card>
          </section>

          <section id="news" className="scroll-mt-28">
            <Card title="17. News by Competition">
              <BulletList items={[
                <>The News page has a button for each active or historical competition available to News. Buttons are created from competition data automatically rather than being hard-coded.</>,
                <>Competition buttons follow the Perfect XV competition order: current/soonest first, then the next soonest, with completed competitions retained as history.</>,
                <>Each active competition receives an introductory sports-desk article covering its start and duration, participating teams, recent winners and useful background.</>,
                <>After play begins, round reports are generated from verified Perfect XV results and leaderboard data.</>,
                <>If an administrator uses <strong>Reset All Game Scores</strong> during testing, match-generated round reports are removed because those games are no longer treated as played. The pre-tournament introduction remains.</>,
              ]} />
              <div className="mt-4">
                <Link href="/news" className="font-semibold text-[var(--brand-blue)] underline">
                  Open Perfect XV News
                </Link>
              </div>
            </Card>
          </section>

          <section id="heritage" className="scroll-mt-28">
            <Card title="18. Heritage & History">
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

          <section id="support" className="scroll-mt-28">
            <Card title="19. Perfect XV Support Chatbot">
              <p className="mb-3 text-[var(--brand-muted)]">
                The Perfect XV chatbot is the built-in first point of contact for questions about using the
                site. Look for the <strong>Ask Perfect XV</strong> button, normally displayed at the
                <strong> bottom-right of the page</strong>. Select it to open the support window, type your
                question and press <strong>Send</strong>.
              </p>
              <BulletList items={[
                <>The chatbot interprets the wording of your question and compares it with the approved Perfect XV help content and support knowledge.</>,
                <>If your question could mean more than one thing, it shows <strong>Likely Matches</strong> so that you can choose what you actually meant rather than receiving a guessed answer.</>,
                <>Where appropriate, the reply contains a shortcut to the relevant part of the site, such as the Leaderboard, Predictions or Account page.</>,
                <>After an answer, you can indicate whether it was helpful. Questions, choices and feedback provide learning signals that help identify wording users actually use and where the current support material is weak or ambiguous.</>,
                <>The chatbot does <strong>not</strong> blindly rewrite itself after one conversation. Reusable improvements are controlled: feedback and recurring question patterns can be reviewed, and an administrator can approve better wording or guidance before it becomes part of future support answers.</>,
                <>If the answer is not satisfactory, select <strong>No — Helpdesk</strong>, enter the email address where you want the reply sent and choose <strong>Send Question to Helpdesk</strong>.</>,
                <>The Helpdesk receives the original question together with the chatbot answer. An administrator can reply to you by email. If that reply resolves a reusable gap in the chatbot&apos;s knowledge, the clarification can be approved as future chatbot guidance.</>,
                <>In this way, every engagement can contribute to improvement: successful matches confirm useful wording, ambiguous questions reveal where more interpretation choices are needed, and unsuccessful answers or Helpdesk clarifications identify material that should be improved.</>,
                <>Do not enter passwords, payment-card details or unnecessary sensitive information into the chatbot.</>,
              ]} />
            </Card>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
