"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/ui/StatCard";
import { formatIsoDate } from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await fetch("/api/admin/dashboard");
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load admin dashboard");
      }

      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error("Admin dashboard load failed:", {
        timestamp: formatIsoDate(new Date()),
        error,
      });
      window.location.href = "/login";
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

  return (
    <main className="bg-white p-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Admin Dashboard"
          subtitle="System overview and tournament telemetry"
        />

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <Button fullWidth onClick={() => { window.location.href = "/admin"; }}>
            Manage Results
          </Button>
          <Button fullWidth variant="secondary" onClick={() => { window.location.href = "/admin/audit"; }}>
            View Audit Log
          </Button>
          <Button fullWidth variant="secondary" onClick={() => { window.location.href = "/dashboard"; }}>
            User Dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={dashboardData?.totalUsers ?? 0}
            tone="navy"
          />
          <StatCard
            title="Total Matches"
            value={dashboardData?.totalMatches ?? 0}
            tone="blue"
          />
          <StatCard
            title="Completed Matches"
            value={dashboardData?.completedMatches ?? 0}
            tone="lime"
          />
          <StatCard
            title="Total Predictions"
            value={dashboardData?.totalPredictions ?? 0}
            tone="orange"
          />
        </div>
      </PageContainer>
    </main>
  );
}