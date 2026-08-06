// @/app/admin/docs/page.tsx
"use client";

import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";

export default function AdminDocsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user?.role?.toUpperCase() === "ADMIN") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Failed to verify admin status", err);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">
        Loading operational documentation...[cite: 1]
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 p-6">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>[cite: 1]
        <p className="text-slate-500 mb-4">You do not have administrative privileges to view operational docs.</p>[cite: 1]
        <a href="/" className="text-blue-600 underline font-medium">Return to Home</a>[cite: 1]
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-12 text-slate-900">
        <PageHeader
          title="Operational Documentation"[cite: 1]
          subtitle="Internal guides, backup protocols, and deployment procedures for administrators."[cite: 1]
          className="mb-8"[cite: 1]
        />

        <div className="space-y-8">
          <Card title="1. Administrator Guide">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                As an administrator, you are responsible for managing tournament fixtures, updating match results, and overseeing user prediction audits.[cite: 1]
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use <strong className="text-slate-900">Admin Results</strong> to input scores and trigger leaderboard recalculations.[cite: 1]</li>
                <li>Monitor system performance and user tracking via the <strong className="text-slate-900">Admin Dashboard</strong>.[cite: 1]</li>
                <li>Review data integrity changes using the <strong className="text-slate-900">Audit</strong> panel.[cite: 1]</li>
              </ul>
            </div>
          </Card>

          <Card title="2. Deployment Guide">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                The application is built on Next.js and deployed on production hosting environments (e.g., Vercel / Node server).[cite: 1]
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Ensure all environment variables are correctly mapped in your production dashboard.[cite: 1]</li>
                <li>Run database migrations prior to build execution using <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">npx prisma migrate deploy</code>.[cite: 1]</li>
                <li>Trigger the build command <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">npm run build</code>.[cite: 1]</li>
              </ol>
            </div>
          </Card>

          <Card title="3. Database Backup Procedure">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                Regular backups prevent loss of user prediction data and leaderboard standings.[cite: 1]
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Automated snapshots should be scheduled daily via your database provider (e.g., Supabase/Neon/PostgreSQL).[cite: 1]</li>
                <li>Manual SQL dumps can be performed via: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">pg_dump $DATABASE_URL &gt; backup.sql</code>.[cite: 1]</li>
              </ul>
            </div>
          </Card>

          <Card title="4. Disaster Recovery Procedure">
            <div className="space-y-3 text-slate-600 text-sm">
              <p>
                In the event of database corruption or data loss:[cite: 1]
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Immediately place the application into maintenance mode if necessary.[cite: 1]</li>
                <li>Restore the latest verified database backup snapshot from your provider.[cite: 1]</li>
                <li>Run Prisma validation tests to ensure schema integrity matches application expectations.[cite: 1]</li>
                <li>Verify authentication flows and leaderboard computations before lifting maintenance mode.[cite: 1]</li>
              </ol>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}