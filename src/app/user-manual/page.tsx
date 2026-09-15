import Link from "next/link";

import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const sections = [
  ["register", "1. Register"],
  ["verify", "2. Verify your email"],
  ["resend", "3. Forgot to verify"],
  ["login", "4. Login"],
  ["password", "5. Reset your password"],
  ["dashboard", "6. Your Dashboard"],
  ["fixtures", "7. Fixtures"],
  ["payment", "8. Competition entry payment"],
  ["predict", "9. Make predictions"],
  ["edit", "10. Edit predictions"],
  ["locking", "11. Prediction status and locking"],
  ["scoring", "12. How scoring works"],
  ["ranking", "13. Leaderboard hierarchy"],
  ["leaderboard", "14. Reading the leaderboard"],
  ["ties", "15. Joint positions and prizes"],
  ["logout", "16. Logout and return later"],
] as const;

function StepNumber({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] font-bold text-white">
      {children}
    </span>
  );
}

function Instruction({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <StepNumber>{number}</StepNumber>
      <div>
        <p className="font-bold text-[var(--brand-navy)]">
          {title}
        </p>
        <div className="mt-1 text-[var(--brand-muted)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function UserManualPage() {
  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Perfect XV User Manual"
          subtitle="A step-by-step guide for entrants"
          className="mb-6"
        />

        <Card className="mb-6">
          <p className="text-lg">
            Perfect XV asks you to predict the scores of the
            15 Six Nations Championship matches. This guide
            takes you from creating your account through to
            understanding your position on the leaderboard.
          </p>

          <div className="mt-5 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
            <p className="font-bold">The short version</p>
            <p className="mt-1 text-[var(--brand-muted)]">
              Register → verify your email → log in → browse
              Perfect XV → pay the &euro;20 competition entry fee
              when you are ready to make predictions → predict
              all 15 matches → check or edit your predictions
              while they are open → follow your score and rank
              as results are entered.
            </p>
          </div>
        </Card>

        <Card title="Contents" className="mb-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-lg border border-[var(--brand-border)] px-3 py-2 font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-soft-lime)]"
              >
                {label}
              </a>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <section id="register" className="scroll-mt-28">
            <Card title="1. Register">
              <p className="mb-4 text-[var(--brand-muted)]">
                Use the Register page the first time you join
                Perfect XV.
              </p>

              <div className="space-y-4">
                <Instruction number={1} title="Enter your first name">
                  This is the first name that will identify you
                  throughout the site.
                </Instruction>

                <Instruction number={2} title="Enter your last name">
                  Your first and last name are used together on
                  the leaderboard.
                </Instruction>

                <Instruction number={3} title="Enter your email address">
                  Use an email address you can access. Perfect XV
                  sends the verification link and password-reset
                  messages to this address.
                </Instruction>

                <Instruction number={4} title="Enter your mobile number">
                  A mobile number is required when creating the
                  account.
                </Instruction>

                <Instruction number={5} title="Choose a password">
                  Your password must contain at least 8
                  characters, including an uppercase letter, a
                  lowercase letter, a number and a special
                  character.
                </Instruction>

                <Instruction number={6} title="Confirm the password">
                  Enter the same password again, then select
                  <strong> Register</strong>.
                </Instruction>
              </div>

              <div className="mt-5 rounded-lg bg-[var(--brand-soft-lime)] p-4">
                <strong>What happens next:</strong> registration
                is not the final step. You must verify your email
                address before using the account normally.
              </div>
            </Card>
          </section>

          <section id="verify" className="scroll-mt-28">
            <Card title="2. Verify Your Email Address">
              <div className="space-y-4">
                <Instruction number={1} title="Open the verification email">
                  After registration, check the inbox for the
                  email address you supplied. If it is not visible,
                  also check Spam or Junk.
                </Instruction>

                <Instruction number={2} title="Select the verification link">
                  The link opens the Perfect XV Email Verification
                  page and checks the verification token.
                </Instruction>

                <Instruction number={3} title="Wait for confirmation">
                  When successful, the page displays
                  <strong> Email successfully verified. You may now log in.</strong>
                </Instruction>

                <Instruction number={4} title="Go to Login">
                  Select <strong>Go To Login</strong> and sign in
                  with the email address and password you registered.
                </Instruction>
              </div>
            </Card>
          </section>

          <section id="resend" className="scroll-mt-28">
            <Card title="3. If You Forgot to Verify Your Email">
              <p className="mb-4 text-[var(--brand-muted)]">
                You do not need to create another account.
              </p>

              <div className="space-y-4">
                <Instruction number={1} title="Open the Login page">
                  Enter the email address used when you registered.
                </Instruction>

                <Instruction number={2} title="Select Resend Verification Email">
                  Perfect XV will request a fresh verification
                  email for a registered account that still needs
                  verification.
                </Instruction>

                <Instruction number={3} title="Check your email">
                  Open the new message and follow its verification
                  link. Check Spam or Junk if necessary.
                </Instruction>
              </div>
            </Card>
          </section>

          <section id="login" className="scroll-mt-28">
            <Card title="4. Login">
              <div className="space-y-4">
                <Instruction number={1} title="Enter your email">
                  Use the verified email address attached to your
                  Perfect XV account.
                </Instruction>

                <Instruction number={2} title="Enter your password">
                  Enter the password created during registration,
                  or your latest password if you have reset it.
                </Instruction>

                <Instruction number={3} title="Select Login">
                  A successful login takes you to your entrant
                  Dashboard.
                </Instruction>
              </div>

              <p className="mt-5 text-sm text-[var(--brand-muted)]">
                The Login page also contains
                <strong> Forgot Password?</strong>,
                <strong> Resend Verification Email</strong> and a
                link to Register.
              </p>
            </Card>
          </section>

          <section id="password" className="scroll-mt-28">
            <Card title="5. Forgotten Password / Reset Password">
              <div className="space-y-4">
                <Instruction number={1} title="Select Forgot Password?">
                  On the Login page, select
                  <strong> Forgot Password?</strong>.
                </Instruction>

                <Instruction number={2} title="Enter your registered email">
                  Select <strong>Send Reset Link</strong>. Perfect XV
                  sends the reset link to that email address.
                </Instruction>

                <Instruction number={3} title="Open the reset link">
                  The link opens the Reset Password page with the
                  reset token already included.
                </Instruction>

                <Instruction number={4} title="Choose your new password">
                  The new password follows the same rule: at least
                  8 characters with uppercase, lowercase, a number
                  and a special character.
                </Instruction>

                <Instruction number={5} title="Confirm and reset">
                  Enter the new password again and select
                  <strong> Reset Password</strong>. After a
                  successful reset, Perfect XV returns you to Login.
                </Instruction>
              </div>
            </Card>
          </section>

          <section id="dashboard" className="scroll-mt-28">
            <Card title="6. Your Dashboard">
              <p className="mb-4 text-[var(--brand-muted)]">
                The Dashboard is your personal overview after
                login.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Main actions</h3>
                  <p className="mt-2 text-[var(--brand-muted)]">
                    <strong>Make Predictions</strong> opens your
                    prediction entry page. <strong>View Leaderboard</strong>
                    opens the current standings.
                    <strong> View Fixtures</strong> shows the
                    championship schedule.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Your status</h3>
                  <p className="mt-2 text-[var(--brand-muted)]">
                    Current Rank, Rank Movement, Prediction
                    Progress and the number of Players show where
                    you stand and whether all 15 predictions have
                    been entered.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4 md:col-span-2">
                  <h3 className="font-bold">Your scoring position</h3>
                  <p className="mt-2 text-[var(--brand-muted)]">
                    The scoring statistics are displayed in the
                    same order used to rank entrants:
                    <strong> Total Points → Correct Results → Exact Scores → Correct Winning Margins → Aggregate Score Error</strong>.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Next Match</h3>
                  <p className="mt-2 text-[var(--brand-muted)]">
                    Shows the next fixture, round, kick-off time and
                    a countdown, with a direct route back to
                    Predictions.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Latest Result</h3>
                  <p className="mt-2 text-[var(--brand-muted)]">
                    Shows the latest completed fixture and how your
                    prediction performed for that match.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section id="fixtures" className="scroll-mt-28">
            <Card title="7. Fixtures">
              <p className="text-[var(--brand-muted)]">
                The Fixtures page lists the 15 Six Nations
                Championship matches in match-number order. Each
                fixture shows the round, teams, date and kick-off
                time, venue and location. When a result has been
                entered, the fixture changes from Scheduled to
                Full time and displays the final score.
              </p>
            </Card>
          </section>

          <section id="payment" className="scroll-mt-28">
            <Card title="8. Competition Entry Payment">
              <p className="mb-4 text-[var(--brand-muted)]">
                You can register, verify your account, log in and
                browse Perfect XV before paying. Payment is only
                required when you are ready to enter the competition
                by making predictions.
              </p>

              <div className="space-y-4">
                <Instruction number={1} title="Open Predictions">
                  Select <strong>Predictions</strong> from the
                  navigation or <strong>Make Predictions</strong>
                  from your Dashboard.
                </Instruction>

                <Instruction number={2} title="Competition Entry Required">
                  If your competition entry has not yet been paid,
                  Perfect XV displays a payment notice instead of
                  the prediction-entry form.
                </Instruction>

                <Instruction number={3} title="Pay the competition entry fee">
                  The full competition entry fee is
                  <strong> &euro;20</strong>. You must complete this
                  payment before you can enter or edit predictions.
                </Instruction>

                <Instruction number={4} title="Continue to Payment">
                  When you are ready, select
                  <strong> Continue to Payment</strong>. You will be
                  taken to the secure payment process.
                </Instruction>

                <Instruction number={5} title="Wait for payment confirmation">
                  After a successful payment has been confirmed,
                  your Perfect XV competition entry is activated and
                  the Predictions page becomes available for entering
                  and editing scores.
                </Instruction>
              </div>

              <div className="mt-5 rounded-lg bg-[var(--brand-soft-lime)] p-4">
                <strong>Important:</strong> Browsing the site does not
                require payment, but a confirmed <strong>&euro;20</strong>
                competition entry payment is required before any
                predictions can be entered or changed.
              </div>
            </Card>
          </section>

          <section id="predict" className="scroll-mt-28">
            <Card title="9. Make Predictions">
              <div className="space-y-4">
                <Instruction number={1} title="Open Predictions">
                  Select <strong>Predictions</strong> from the
                  navigation or <strong>Make Predictions</strong>
                  from your Dashboard.
                </Instruction>

                <Instruction number={2} title="Check Prediction Progress">
                  The progress display shows how many of the 15
                  fixtures already have a saved prediction. Your
                  target is <strong>15 / 15</strong>.
                </Instruction>

                <Instruction number={3} title="Choose a fixture">
                  The Fixtures panel lists each game and shows
                  whether it is <strong>OPEN</strong>,
                  <strong> LOCKED</strong> or
                  <strong> COMPLETE</strong>.
                </Instruction>

                <Instruction number={4} title="Enter both scores">
                  Enter the number of points you predict for the
                  home team and the away team.
                </Instruction>

                <Instruction number={5} title="Save Prediction">
                  Select <strong>Save Prediction</strong>. Perfect XV
                  confirms that the prediction was saved and moves
                  you towards the next unpredicted fixture.
                </Instruction>

                <Instruction number={6} title="Complete all 15">
                  Continue until Prediction Progress shows
                  <strong> 15 / 15</strong>.
                </Instruction>
              </div>
            </Card>
          </section>

          <section id="edit" className="scroll-mt-28">
            <Card title="10. Edit a Prediction">
              <div className="space-y-4">
                <Instruction number={1} title="Open Your Predictions">
                  On the Predictions page, the
                  <strong> Your Predictions</strong> panel lists
                  scores you have already saved.
                </Instruction>

                <Instruction number={2} title="Select the prediction">
                  Select the saved fixture you want to change.
                  Perfect XV loads the existing home and away scores
                  into the prediction form.
                </Instruction>

                <Instruction number={3} title="Change the scores">
                  Enter the revised prediction while the fixture is
                  still open.
                </Instruction>

                <Instruction number={4} title="Update Prediction">
                  Select <strong>Update Prediction</strong>. The
                  updated prediction replaces the previous saved
                  score for that fixture.
                </Instruction>
              </div>
            </Card>
          </section>

          <section id="locking" className="scroll-mt-28">
            <Card title="11. Prediction Status and Locking">
              <p className="text-[var(--brand-muted)]">
                The Predictions page shows the current status of
                each fixture and displays a countdown while a
                prediction is still open. Once a fixture is shown
                as <strong>LOCKED</strong> or
                <strong> COMPLETE</strong>, that prediction can no
                longer be edited. Save changes well before the
                displayed deadline.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <strong>OPEN</strong>
                  <p className="mt-1 text-sm">
                    Prediction can be entered or edited.
                  </p>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <strong>LOCKED</strong>
                  <p className="mt-1 text-sm">
                    No further changes are accepted.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <strong>COMPLETE</strong>
                  <p className="mt-1 text-sm">
                    The match has been completed.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section id="scoring" className="scroll-mt-28">
            <Card title="12. How Scoring Is Calculated">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 p-3">
                        Prediction outcome
                      </th>
                      <th className="border border-slate-200 p-3">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-3">
                        Correct result/winner, but not exact score
                      </td>
                      <td className="border border-slate-200 p-3 font-bold">
                        1
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3">
                        Exact score
                      </td>
                      <td className="border border-slate-200 p-3 font-bold">
                        4 total
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3">
                        Incorrect result
                      </td>
                      <td className="border border-slate-200 p-3 font-bold">
                        0
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-[var(--brand-muted)]">
                An exact score receives the 1 point for the correct
                result plus a 3-point exact-score bonus, giving
                <strong> 4 points total</strong>. A correct winning
                margin is recorded as a ranking statistic but does
                not add a separate points bonus.
              </p>

              <div className="mt-5 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
                <h3 className="font-bold">Aggregate Score Error</h3>
                <p className="mt-1 text-[var(--brand-muted)]">
                  This measures how far your predicted scores were
                  from the actual scores for both teams.
                </p>
                <p className="mt-2 font-semibold">
                  Example: predicted 24–18, actual 27–16.
                </p>
                <p className="mt-1">
                  Home error = 3, away error = 2, so match score
                  error = <strong>5</strong>.
                </p>
              </div>
            </Card>
          </section>

          <section id="ranking" className="scroll-mt-28">
            <Card title="13. Leaderboard Ranking Hierarchy">
              <p className="mb-4 text-[var(--brand-muted)]">
                Official Rank is calculated using the following
                criteria in this exact order. A later criterion is
                considered only when entrants are tied on every
                criterion before it.
              </p>

              <div className="space-y-3">
                {[
                  ["1", "Points Total", "Highest points total ranks first."],
                  ["2", "Correct Wins", "Most correctly predicted match outcomes."],
                  ["3", "Perfect Scores", "Most exact score predictions."],
                  ["4", "Correct Margins", "Most exactly predicted winning margins. A correctly predicted draw has a margin of zero."],
                  ["5", "Lowest Aggregate Score Error", "If entrants are still tied, the lowest cumulative absolute score error across completed matches ranks first."],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="flex gap-3 rounded-lg border border-[var(--brand-border)] p-4"
                  >
                    <StepNumber>{number}</StepNumber>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="mt-1 text-[var(--brand-muted)]">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
                <p className="font-bold">Where Prediction Delta fits</p>
                <p className="mt-1 text-[var(--brand-muted)]">
                  <strong>Prediction Delta</strong> is displayed on the
                  Leaderboard as an additional measure of prediction
                  accuracy. It is <strong>not</strong> currently used to
                  determine official Rank.
                </p>
              </div>

              <div className="mt-5 rounded-lg bg-[var(--brand-soft-lime)] p-4">
                If entrants remain identical after all five official
                ranking criteria, they remain
                <strong> jointly ranked</strong>.
              </div>
            </Card>
          </section>

          <section id="leaderboard" className="scroll-mt-28">
            <Card title="14. Reading the Leaderboard">
              <p className="mb-4 text-[var(--brand-muted)]">
                The leaderboard columns match the Leaderboard PDF.
                The ranking-related columns appear first, followed by
                Prediction Delta and Movement:
              </p>

              <p className="font-semibold">
                Rank → Player → Points Total → Correct Wins →
                Perfect Scores → Correct Margins → Prediction Delta →
                Movement
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Rank</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    Your official competition position after all
                    ranking criteria have been applied. The top three
                    positions are highlighted with medal symbols.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Player</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    The entrant&apos;s name.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Points Total</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    The first official ranking criterion. Entrants
                    with the highest points total rank ahead.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Correct Wins</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    The second official ranking criterion when Points
                    Total is tied. It counts correctly predicted match
                    outcomes.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Perfect Scores</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    The third official ranking criterion. It counts
                    predictions where both teams&apos; scores were
                    predicted exactly.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Correct Margins</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    The fourth official ranking criterion. It counts
                    matches where the winning margin was predicted
                    exactly. A correctly predicted draw has a margin
                    of zero.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft-blue)] p-4">
                  <h3 className="text-lg font-bold">Prediction Delta</h3>
                  <p className="mt-2 text-[var(--brand-muted)]">
                    <strong>Prediction Delta</strong> measures how close your
                    predicted winning margin was to the real winning margin.
                    It does not depend on the exact scores; it compares the
                    difference between the teams. A lower value is better.
                  </p>

                  <div className="mt-4 space-y-2 text-[var(--brand-muted)]">
                    <p>
                      <strong>1.</strong> Actual margin = Actual Home Score −
                      Actual Away Score.
                    </p>
                    <p>
                      <strong>2.</strong> Predicted margin = Predicted Home
                      Score − Predicted Away Score.
                    </p>
                    <p>
                      <strong>3.</strong> Margin difference = |Actual Margin −
                      Predicted Margin|.
                    </p>
                    <p>
                      <strong>4.</strong> If you predicted the correct winner,
                      that difference is subtracted from your Prediction Delta.
                      If you predicted the wrong winner, it is added.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[var(--brand-border)] bg-white p-3">
                      <p className="font-bold">Example — Correct Winner</p>
                      <p className="mt-1 text-sm text-[var(--brand-muted)]">
                        Actual: Ireland 56–12 England. Actual margin = 44.
                        Prediction: Ireland 60–20 England. Predicted margin =
                        40. Difference = 4. Ireland was correctly predicted to
                        win, so <strong>Prediction Delta changes by −4</strong>.
                      </p>
                    </div>

                    <div className="rounded-lg border border-[var(--brand-border)] bg-white p-3">
                      <p className="font-bold">Example — Wrong Winner</p>
                      <p className="mt-1 text-sm text-[var(--brand-muted)]">
                        Actual: Ireland 56–12 England. Actual margin = +44.
                        Prediction: Ireland 20–30 England. Predicted margin =
                        −10. Difference = |44 − (−10)| = 54. England was
                        incorrectly predicted to win, so
                        <strong> Prediction Delta changes by +54</strong>.
                      </p>
                    </div>

                    <div className="rounded-lg border border-[var(--brand-border)] bg-white p-3">
                      <p className="font-bold">Example — Perfect Margin</p>
                      <p className="mt-1 text-sm text-[var(--brand-muted)]">
                        Actual: France 20–18 Wales. Prediction: France 19–17
                        Wales. Both margins are 2, so the difference is 0 and
                        <strong> Prediction Delta changes by 0</strong>.
                      </p>
                    </div>

                    <div className="rounded-lg border border-[var(--brand-border)] bg-white p-3">
                      <p className="font-bold">
                        Example — Correct Winner, Different Margin
                      </p>
                      <p className="mt-1 text-sm text-[var(--brand-muted)]">
                        Actual: Scotland 30–10 Italy. Actual margin = 20.
                        Prediction: Scotland 25–20 Italy. Predicted margin = 5.
                        Difference = 15. Scotland was correctly predicted to
                        win, so <strong>Prediction Delta changes by −15</strong>.
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 font-semibold">
                    In one line: Prediction Delta is the difference between
                    the actual margin and predicted margin, subtracted for a
                    correct result and added for an incorrect result. Lower is
                    better.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Movement</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    Shows how the entrant&apos;s official rank changed after
                    the latest leaderboard recalculation. ↑ means moved up,
                    ↓ means moved down, → means unchanged and — means there is
                    no previous ranking to compare.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--brand-border)] p-4">
                  <h3 className="font-bold">Sort By</h3>
                  <p className="mt-1 text-[var(--brand-muted)]">
                    You can temporarily sort the table by a displayed
                    statistic or by Player. This changes how you view the
                    table; the official Rank remains calculated using the
                    competition hierarchy.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section id="ties" className="scroll-mt-28">
            <Card title="15. Joint Positions and Prizes">
              <p className="text-[var(--brand-muted)]">
                The prize positions use a 3:2:1 ratio. If two
                entrants are joint winners after all five ranking
                criteria, the first- and second-place prizes are
                pooled and divided equally. If three or more
                entrants are joint winners, the first-, second- and
                third-place prizes are pooled and divided equally
                between the joint winners.
              </p>
            </Card>
          </section>

          <section id="logout" className="scroll-mt-28">
            <Card title="16. Logout and Return Later">
              <p className="text-[var(--brand-muted)]">
                Select your name at the top of the site to open
                your account menu. Choose <strong>Logout</strong>
                when you have finished. Your saved predictions
                remain attached to your account. When you return,
                use the Login page with the same verified email
                address and password.
              </p>
            </Card>
          </section>
        </div>

        <Card className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">Ready to continue?</p>
              <p className="text-sm text-[var(--brand-muted)]">
                Return to your Dashboard or Predictions.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-[var(--brand-navy)] px-4 py-2 font-semibold text-white"
              >
                Dashboard
              </Link>

              <Link
                href="/predictions"
                className="rounded-lg border border-[var(--brand-border)] px-4 py-2 font-semibold text-[var(--brand-navy)]"
              >
                Predictions
              </Link>
            </div>
          </div>
        </Card>
      </PageContainer>
    </main>
  );
}
