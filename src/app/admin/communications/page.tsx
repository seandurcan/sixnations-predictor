"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type CountsResponse = {
  success: boolean;
  verificationRemindersDue: number;
  predictionRemindersDue: number;
  error?: string;
};

type SettingsResponse = {
  success: boolean;
  automaticRemindersEnabled: boolean;
  error?: string;
};

type TestUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
};

export default function CommunicationsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [testingWindowActive, setTestingWindowActive] = useState(false);
  const [testingWindowExpiresAt, setTestingWindowExpiresAt] = useState<string | null>(null);

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
      const [countsResponse, settingsResponse, testingResponse] = await Promise.all([
        fetch("/api/admin/reminders/counts", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/settings", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/reminder-testing", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const counts = (await countsResponse.json()) as CountsResponse;
      const settings = (await settingsResponse.json()) as SettingsResponse;
      const testing = await testingResponse.json();

      if (!countsResponse.ok || !counts.success) {
        throw new Error(counts.error || "Unable to load reminder counts.");
      }
      if (!settingsResponse.ok || !settings.success) {
        throw new Error(settings.error || "Unable to load reminder settings.");
      }
      if (!testingResponse.ok || !testing.success) {
        throw new Error(testing.error || "Unable to load reminder testing controls.");
      }

      setVerificationRemindersDue(counts.verificationRemindersDue ?? 0);
      setPredictionRemindersDue(counts.predictionRemindersDue ?? 0);
      setAutomaticRemindersEnabled(settings.automaticRemindersEnabled);
      setTestUsers(testing.users ?? []);
      setTestingWindowActive(Boolean(testing.active));
      setTestingWindowExpiresAt(testing.expiresAt ?? null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load communications data."
      );
    }
  }

  async function markSelectedUserUnverified() {
    if (!selectedUserId) {
      setError("Select a user first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");
      const response = await fetch("/api/admin/reminder-testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: Number(selectedUserId) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to mark the user unverified.");
      }
      setMessage(result.message);
      await loadDashboardData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to mark the user unverified.");
    } finally {
      setLoading(false);
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

      const responseText = await response.text();
      let result: {
        success?: boolean;
        sent?: number;
        failed?: number;
        error?: string;
      };

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Reminder service returned HTTP ${response.status} instead of a valid response.`
        );
      }

      if (!response.ok || !result.success) {
        setError(
          result.error ??
            `Request failed with HTTP ${response.status}.`
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
              {testingWindowActive && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="font-semibold">Temporary reminder testing</p>
                  <p className="mb-3 text-sm text-slate-600">
                    Repeated manual verification and prediction sends are available until{
                      testingWindowExpiresAt
                        ? ` ${new Date(testingWindowExpiresAt).toLocaleString("en-IE", { timeZone: "Europe/Dublin" })}`
                        : " 09:00 tomorrow"
                    }. Automatic reminders remain separate.
                  </p>
                  <select
                    className="mb-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a user to mark unverified</option>
                    {testUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} — {user.email}{user.emailVerified ? "" : " (unverified)"}
                      </option>
                    ))}
                  </select>
                  <Button
                    fullWidth
                    variant="secondary"
                    disabled={loading || !selectedUserId}
                    onClick={markSelectedUserUnverified}
                  >
                    Mark Selected User Unverified
                  </Button>
                </div>
              )}

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
