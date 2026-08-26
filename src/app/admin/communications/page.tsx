"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type DashboardResponse = {
  metrics: {
    verificationRemindersDue: number;
    predictionRemindersDue: number;
    automaticRemindersEnabled: boolean;
    finalReminderPending: boolean;
    finalReminderDate: string | null;
    lastReminderRun: string | null;
    nextReminderRun: string | null;
  };
};

export default function CommunicationsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [
    automaticRemindersEnabled,
    setAutomaticRemindersEnabled,
  ] = useState(true);

  const [
    verificationRemindersDue,
    setVerificationRemindersDue,
  ] = useState(0);

  const [
    predictionRemindersDue,
    setPredictionRemindersDue,
  ] = useState(0);

  const [
    finalReminderPending,
    setFinalReminderPending,
  ] = useState(false);

  const [
    finalReminderDate,
    setFinalReminderDate,
  ] = useState<string | null>(null);

  const [
    lastReminderRun,
    setLastReminderRun,
  ] = useState<string | null>(null);

  const [
    nextReminderRun,
    setNextReminderRun,
  ] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const response = await fetch(
        "/api/admin/dashboard",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const result =
        (await response.json()) as DashboardResponse;

      setAutomaticRemindersEnabled(
        result.metrics.automaticRemindersEnabled
      );

      setVerificationRemindersDue(
        result.metrics.verificationRemindersDue ?? 0
      );

      setPredictionRemindersDue(
        result.metrics.predictionRemindersDue ?? 0
      );

      setFinalReminderPending(
        result.metrics.finalReminderPending
      );

      setFinalReminderDate(
        result.metrics.finalReminderDate
      );

      setLastReminderRun(
        result.metrics.lastReminderRun
      );

      setNextReminderRun(
        result.metrics.nextReminderRun
      );
    } catch {
      setError(
        "Unable to load communications data."
      );
    }
  }

  async function toggleAutomaticReminders() {
    try {
      const response = await fetch(
        "/api/admin/settings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            automaticRemindersEnabled:
              !automaticRemindersEnabled,
          }),
        }
      );

      const result =
        await response.json();

      if (result.success) {
        setAutomaticRemindersEnabled(
          result.automaticRemindersEnabled
        );

        setMessage(
          `Automatic reminders ${
            result.automaticRemindersEnabled
              ? "enabled"
              : "disabled"
          }.`
        );

        await loadDashboardData();
      }
    } catch {
      setError(
        "Unable to update settings."
      );
    }
  }

  async function runAction(
    action:
      | "verification"
      | "prediction"
      | "preview-verification"
      | "preview-prediction"
  ) {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response =
        await fetch(
          "/api/admin/reminders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              action,
            }),
          }
        );

      const result =
        await response.json();

      if (!result.success) {
        setError(
          result.error ??
            "Request failed."
        );
        return;
      }

      if (
        action ===
          "preview-verification" ||
        action ===
          "preview-prediction"
      ) {
        setMessage(
          "Preview generated successfully."
        );
        return;
      }

      setMessage(
        `Operation completed successfully. Emails sent: ${
          result.sent ?? 0
        }`
      );

      await loadDashboardData();
    } catch {
      setError(
        "Operation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-white text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Communications"
          subtitle="Manage reminder emails and automation"
        />

        {message && (
          <Alert
            variant="success"
            title="Success"
            className="mb-4"
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert
            variant="error"
            title="Error"
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Reminder Emails">
            <div className="space-y-4">
              <Button
                fullWidth
                disabled={loading}
                onClick={() =>
                  runAction(
                    "verification"
                  )
                }
              >
                Send Verification
                Reminders
              </Button>

              <Button
                fullWidth
                disabled={loading}
                onClick={() =>
                  runAction(
                    "prediction"
                  )
                }
              >
                Send Prediction
                Reminders
              </Button>

              <Button
                fullWidth
                variant="secondary"
                disabled={loading}
                onClick={() =>
                  runAction(
                    "preview-verification"
                  )
                }
              >
                Preview Verification
                Email
              </Button>

              <Button
                fullWidth
                variant="secondary"
                disabled={loading}
                onClick={() =>
                  runAction(
                    "preview-prediction"
                  )
                }
              >
                Preview Prediction
                Email
              </Button>
            </div>
          </Card>

          <Card title="Automatic Reminders">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500">
                    Verification Reminders Due
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[var(--brand-blue)]">
                    {verificationRemindersDue}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500">
                    Prediction Reminders Due
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[var(--brand-orange)]">
                    {predictionRemindersDue}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      Automatic Reminders
                    </p>
                    <p className="text-sm text-slate-500">
                      Weekly Saturday 09:00
                    </p>
                  </div>

                  <Button
                    variant={
                      automaticRemindersEnabled
                        ? "primary"
                        : "secondary"
                    }
                    onClick={
                      toggleAutomaticReminders
                    }
                  >
                    {automaticRemindersEnabled
                      ? "ON"
                      : "OFF"}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="font-semibold">
                  Final Reminder Pending
                </p>

                <p className="text-sm text-slate-600">
                  {finalReminderPending
                    ? "Yes"
                    : "No"}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="font-semibold">
                  Final Reminder Date
                </p>

                <p className="text-sm text-slate-600">
                  {finalReminderDate
                    ? new Date(
                        finalReminderDate
                      ).toLocaleString(
                        "en-IE"
                      )
                    : "Not scheduled"}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="font-semibold">
                  Last Reminder Run
                </p>

                <p className="text-sm text-slate-600">
                  {lastReminderRun
                    ? new Date(
                        lastReminderRun
                      ).toLocaleString(
                        "en-IE"
                      )
                    : "Never"}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="font-semibold">
                  Next Reminder Run
                </p>

                <p className="text-sm text-slate-600">
                  {nextReminderRun
                    ? new Date(
                        nextReminderRun
                      ).toLocaleString(
                        "en-IE"
                      )
                    : "Disabled"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
