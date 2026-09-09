"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/ui/StatCard";
import { formatIsoDate } from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

type DashboardMetrics = {
  userCount: number;
  verifiedUserCount: number;
  predictionCount: number;
  playersWithPredictions?: number;
  completedFixtures: number;
  remainingFixtures: number;
  totalFixtures: number;
};

type DashboardData = {
  success: boolean;
  error?: string;
  metrics: DashboardMetrics;
};

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      const data = (await response.json()) as DashboardData;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        throw new Error(
          data.error || "Failed to load admin dashboard"
        );
      }

      if (!data.success || !data.metrics) {
        throw new Error("Dashboard API returned invalid data");
      }

      setDashboardData(data);
    } catch (loadError) {
      console.error("Admin dashboard load failed:", {
        timestamp: formatIsoDate(new Date()),
        error: loadError,
      });

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load admin dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageContainer>
          <PageHeader
            title="Admin Dashboard"
            subtitle="Loading admin metrics..."
          />
          <Card>Loading dashboard...</Card>
        </PageContainer>
      </main>
    );
  }

  if (error || !dashboardData) {
    return (
      <main className="bg-white p-8 text-[var(--brand-navy)]">
        <PageContainer>
          <PageHeader
            title="Admin Dashboard"
            subtitle="System overview and tournament telemetry"
          />
          <Card>
            <p className="font-semibold text-red-700">
              {error || "Dashboard data is unavailable."}
            </p>
            <div className="mt-4">
              <Button onClick={() => void loadDashboard()}>
                Retry
              </Button>
            </div>
          </Card>
        </PageContainer>
      </main>
    );
  }

  const metrics = dashboardData.metrics;

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Admin Dashboard"
          subtitle="System overview and tournament telemetry"
        />

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <Button
            fullWidth
            onClick={() => {
              window.location.href = "/admin";
            }}
          >
            Manage Results
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              window.location.href = "/admin/audit";
            }}
          >
            View Audit Log
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            User Dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={metrics.userCount}
            tone="navy"
          />
          <StatCard
            title="Matches Remaining"
            value={metrics.remainingFixtures}
            tone="blue"
          />
          <StatCard
            title="Completed Matches"
            value={metrics.completedFixtures}
            tone="lime"
          />
          <StatCard
            title="Players with Predictions"
            value={
              metrics.playersWithPredictions ??
              metrics.predictionCount
            }
            tone="orange"
          />
        </div>
      </PageContainer>
    </main>
  );
}
