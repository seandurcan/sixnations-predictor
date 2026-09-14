# Live polling and private prediction PDFs

## Baseline and rollback

Source reconstructed from Git commit `ef7342ebda57af431c60ce6a33ff86eadf0b0144` plus the complete `patch-live-scoring.js` from production deployment `dpl_6qRUP8DMwDXsosy42TB331tjugQH`.

The established rollback point remains `dpl_7gF4yvXTKzG6tA9ZopfhdNtNNwKJ` (`perfect-q04uxlh0t-perfect-xv.vercel.app`). The prior live-scoring deployment is also retained. No database schema changes or migrations are part of this release. Build explicitly runs Prisma client generation and Next.js compilation only. Existing cron configuration is preserved.

## Changes

- Live provider requests use a 30-second minimum interval per match, atomically claimed in the existing SystemSetting table before calling the provider, including failed requests. Matches on the same date can share one provider request.
- The expected match window is two hours from kickoff, followed by a 30-minute safety allowance. No expected-end field exists in the current schema. Calls stop at provider completion, or after 150 minutes from kickoff. Pre-kickoff calls remain suppressed.
- Admin corrections and provider writes serialize per match. Provider updates check override again before saving. Resume API Updates can hand an Admin full-time correction back to the provider within the allowed window. Admin test mode retains its prior behavior.
- The Dashboard includes a PDF download utility. The server takes user identity only from the existing session and queries only that user's saved predictions and submission receipts. There is no request parameter to choose another account. Responses are private/no-store.
- PDFs group fixtures by tournament, with match number, home/away teams, Dublin kickoff time, both predicted scores, original save time, prediction ID, and any existing tournament receipt. They show the current saved values; the database does not contain historical prediction versions.

## Verification

- 33 targeted tests passed: polling boundaries, concurrent claims, failed-provider throttling, override/resume, private PDF generation, empty state, account isolation, pagination, scoring, and existing prediction-list access.
- Final preview `dpl_75YE83VTJLpRi21S6MpR5dKY1FSz` passed build and TypeScript checks.
- Preview `/api/live-score-sync`: zero active matches, zero provider queries, zero updates.
- Preview PDF endpoint: unauthenticated request returns 401 with private/no-store and Vary: Cookie. Dashboard redirects to Login without a session.
- Two-page PDF sample visually rendered and reviewed, including long team names and accented names.
- Existing dashboard test suite: 21 pass and 9 fail. Running against the untouched pinned dashboard produces the same 9 failures. Two unrelated test typing errors were corrected to allow production type checking.
- No production fixtures, results, predictions, or users were created or altered for testing. No live-match end-to-end test was possible with zero active tournament fixtures. A real signed-in account download remains a user acceptance check; generation and ownership were tested with mocked sessions/data.

## Operation

As before, live collection is triggered while Fixtures, Leaderboard or Admin is open; this release does not add an unattended scheduler. The existing live-score test, reminders, alerts, scoring rules, leaderboard and Fixtures layout are retained from the production baseline. Preview email credentials are deliberately inert; production uses its existing environment without preview overrides.
