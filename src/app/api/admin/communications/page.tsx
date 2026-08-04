FILE: src/app/admin/communications/page.tsx

"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default function CommunicationsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [
    automaticRemindersEnabled,
    setAutomaticRemindersEnabled,
  ] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch(
        "/api/admin/settings"
      );

      const result =
        await response.json();

      if (result.success) {
        setAutomaticRemindersEnabled(
          result.automaticRemindersEnabled
        );
      }
    } catch {
      setError(
        "Unable to load settings."
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
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      Automatic Reminders
                    </p>

                    <p className="text-sm text-slate-500">
                      Weekly Saturday
                      09:00
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
                  Weekly Reminder
                </p>

                <p className="text-sm text-slate-600">
                  Every Saturday at
                  09:00 for unverified
                  users and users with
                  incomplete predictions.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="font-semibold">
                  Final Reminder
                </p>

                <p className="text-sm text-slate-600">
                  09:00 on the day of
                  the first fixture of
                  the tournament.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}