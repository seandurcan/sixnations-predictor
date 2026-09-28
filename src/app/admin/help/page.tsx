"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function HelpAndManualsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        if (response.ok) {
          const result = await response.json();
          if (
            result.authenticated &&
            result.user?.role?.toUpperCase() === "ADMIN"
          ) {
            setIsAdmin(true);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8 text-slate-500">
        <PageContainer>Loading Help &amp; Manuals...</PageContainer>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-white p-8 text-slate-900">
        <PageContainer>
          <Card>
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="mt-2 text-slate-500">
              Administrator access is required.
            </p>
          </Card>
        </PageContainer>
      </main>
    );
  }

  const manuals = [
    {
      title: "User Manual",
      description:
        "Entrant guide covering registration, verification, competitions, predictions, scoring, Prediction Delta, leaderboard, invitations and account features.",
      href: "/user-manual",
    },
    {
      title: "Administration Manual",
      description:
        "Administrator guide covering competitions, fixtures, entrants, users, communications, reminders, scoring, results, audits and match-day administration.",
      href: "/admin/manual",
    },
    {
      title: "Operational Docs",
      description:
        "Technical and operational guidance covering staging-first deployment, backups, recovery, database rules, Stripe, email and release verification.",
      href: "/admin/docs",
    },
  ];

  return (
    <main className="bg-white py-8 text-[var(--brand-navy)]">
      <PageContainer>
        <PageHeader
          title="Help & Manuals"
          subtitle="Perfect XV user, administration and operational documentation"
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {manuals.map((manual) => (
            <Card key={manual.href} title={manual.title}>
              <p className="mb-5 text-[var(--brand-muted)]">
                {manual.description}
              </p>
              <Link href={manual.href}>
                <Button fullWidth>Open {manual.title}</Button>
              </Link>
            </Card>
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
