"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import {
  TESTER_CHECK_SECTIONS,
  type TesterCheckStatus,
} from "@/lib/testerCheckSheet";

type StatusMap = Record<string, TesterCheckStatus>;
type CommentMap = Record<string, string>;

function initialStatuses(): StatusMap {
  return Object.fromEntries(
    TESTER_CHECK_SECTIONS.flatMap((section) =>
      section.activities.map((activity) => [activity.id, "not-tested"])
    )
  ) as StatusMap;
}

export default function TesterCheckSheetPage() {
  const [testerName, setTesterName] = useState("");
  const [testerEmail, setTesterEmail] = useState("");
  const [device, setDevice] = useState("");
  const [statuses, setStatuses] = useState<StatusMap>(initialStatuses);
  const [comments, setComments] = useState<CommentMap>({});
  const [overallComments, setOverallComments] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!data?.authenticated || !data?.user) return;
        const name = [data.user.firstName, data.user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (name) setTesterName(name);
        if (data.user.email) setTesterEmail(data.user.email);
      } catch {
        // Prefill is optional.
      }
    })();
  }, []);

  const issueCount = useMemo(
    () => Object.values(statuses).filter((status) => status === "issue").length,
    [statuses]
  );

  function setStatus(activityId: string, status: TesterCheckStatus) {
    setStatuses((current) => ({ ...current, [activityId]: status }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitMessage("");
    setSubmitError("");

    const missingIssueComment = TESTER_CHECK_SECTIONS.find((section) =>
      section.activities.some(
        (activity) => statuses[activity.id] === "issue"
      ) && !(comments[section.id] ?? "").trim()
    );

    if (missingIssueComment) {
      setSubmitError(
        `Please add a short comment for ${missingIssueComment.title} because an issue is marked there.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tester-check-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testerName,
          testerEmail,
          device,
          statuses,
          comments,
          overallComments,
          website,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Please sign in to Perfect XV before submitting the online check sheet. You can still print it without signing in."
        );
      }
      if (!response.ok) {
        throw new Error(data?.error ?? "The check sheet could not be submitted.");
      }

      setSubmitMessage(
        "Thank you. Your tester check sheet has been emailed to the Perfect XV administrator."
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The check sheet could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <style>{`
          @media print {
            header, nav, footer, .tester-screen-only, .fixed { display: none !important; }
            body, main { background: white !important; }
            main { padding: 0 !important; }
            .tester-print-card {
              box-shadow: none !important;
              break-inside: avoid;
              border-color: #999 !important;
            }
            textarea {
              min-height: 85px !important;
              border: 1px solid #999 !important;
              background: white !important;
            }
            input[type="text"], input[type="email"] {
              border: 0 !important;
              border-bottom: 1px solid #777 !important;
              border-radius: 0 !important;
            }
            .tester-print-only { display: block !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .tester-print-only { display: none; }
        `}</style>

        <div className="tester-screen-only mb-6">
          <PageHeader
            title="Perfect XV Tester Quick Check"
            subtitle="A short check sheet to help us find faults and streamline anything that feels awkward, unclear or unnecessary."
          />
        </div>

        <div className="tester-print-only mb-5">
          <h1 className="text-3xl font-black">Perfect XV Tester Quick Check</h1>
          <p className="mt-2 text-sm">
            Please tick what you tested and add brief comments for anything that did not work or could be improved.
          </p>
        </div>

        <Card className="tester-print-card mb-6">
          <p className="text-[var(--brand-muted)]">
            This is not an exam. Test as much as you reasonably can. Mark <strong>OK</strong>,
            <strong> Issue</strong> or <strong>Not tested</strong>. Your comments will be used to
            fix faults and/or streamline Perfect XV before wider use.
          </p>

          <div className="tester-screen-only mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { window.location.href = "/"; }}
            >
              Back to Perfect XV
            </Button>
          </div>

          <p className="tester-print-only mt-4 text-sm font-semibold">
            Return completed sheet: administrator@perfect-xv.org or WhatsApp 089 263 0893.
          </p>
        </Card>

        <form onSubmit={submit} className="space-y-6">
          <Card title="Tester details" className="tester-print-card">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-semibold">
                Name
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 font-normal"
                  value={testerName}
                  onChange={(event) => setTesterName(event.target.value)}
                  maxLength={120}
                />
              </label>
              <label className="text-sm font-semibold">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 font-normal"
                  value={testerEmail}
                  onChange={(event) => setTesterEmail(event.target.value)}
                  maxLength={254}
                />
              </label>
              <label className="text-sm font-semibold">
                Device / browser
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 font-normal"
                  value={device}
                  onChange={(event) => setDevice(event.target.value)}
                  placeholder="e.g. Android / Chrome"
                  maxLength={200}
                />
              </label>
            </div>
          </Card>

          {TESTER_CHECK_SECTIONS.map((section) => (
            <Card
              key={section.id}
              title={section.title}
              className="tester-print-card"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--brand-border)] text-left">
                      <th className="py-2 pr-3">Activity</th>
                      <th className="w-20 px-2 text-center">OK</th>
                      <th className="w-20 px-2 text-center">Issue</th>
                      <th className="w-24 px-2 text-center">Not tested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.activities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-3">{activity.label}</td>
                        {(["ok", "issue", "not-tested"] as TesterCheckStatus[]).map(
                          (status) => (
                            <td key={status} className="px-2 text-center">
                              <input
                                type="radio"
                                name={activity.id}
                                aria-label={`${activity.label}: ${status}`}
                                checked={statuses[activity.id] === status}
                                onChange={() => setStatus(activity.id, status)}
                              />
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="mt-4 block text-sm font-semibold">
                Comments / issues for this section
                <textarea
                  className="mt-2 min-h-24 w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 font-normal"
                  value={comments[section.id] ?? ""}
                  onChange={(event) =>
                    setComments((current) => ({
                      ...current,
                      [section.id]: event.target.value,
                    }))
                  }
                  maxLength={2000}
                  placeholder="What happened? What did you expect? Anything awkward or unclear?"
                />
              </label>
            </Card>
          ))}

          <Card title="Overall comments" className="tester-print-card">
            <textarea
              className="min-h-32 w-full rounded-lg border border-[var(--brand-border)] px-3 py-2"
              value={overallComments}
              onChange={(event) => setOverallComments(event.target.value)}
              maxLength={4000}
              placeholder="Anything else that would make Perfect XV easier, clearer or more enjoyable to use?"
            />
            <p className="mt-3 text-sm text-[var(--brand-muted)]">
              Issues marked: {issueCount}
            </p>
          </Card>

          <div className="tester-screen-only">
            <label className="sr-only" aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>

            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
                {submitError}
              </div>
            )}
            {submitMessage && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800" role="status">
                {submitMessage}
              </div>
            )}

            <Card className="mb-4">
              <p className="text-sm text-[var(--brand-muted)]">
                Online submission emails this check sheet to <strong>administrator@perfect-xv.org</strong>.
                You must be signed in to submit online.
              </p>
            </Card>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Tester Check Sheet"}
            </Button>
          </div>

          <div className="tester-print-only mt-6 border-t border-slate-400 pt-4 text-sm">
            <p><strong>Return to:</strong> administrator@perfect-xv.org</p>
            <p className="mt-1"><strong>Or WhatsApp:</strong> 089 263 0893</p>
          </div>
        </form>
      </PageContainer>
    </main>
  );
}
