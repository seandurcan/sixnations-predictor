"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { formatIrishDate, formatIsoDate } from "@/lib/formatIrishDate";
import { useEffect, useState } from "react";

export default function AuditPage() {
  const [audits, setAudits] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const pageSize = 10;

  useEffect(() => {
    loadAuditHistory(page);
  }, [page]);

  async function loadAuditHistory(
    currentPage: number
  ) {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/audit?page=${currentPage}&pageSize=${pageSize}`
      );

      if (response.status === 401) {
        window.location.href =
          "/login";
        return;
      }

      if (response.status === 403) {
        window.location.href =
          "/dashboard";
        return;
      }

      const result =
        await response.json();

      setAudits(
        result.audits ?? []
      );

      setTotalPages(
        result.totalPages ?? 1
      );
    } catch (error) {
      console.error(
        "Audit history load failed:",
        {
          timestamp: formatIsoDate(
            new Date()
          ),
          error,
        }
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        <PageHeader
          title="Audit History"
          subtitle="Loading audit records..."
        />

        <Card>
          Loading audit history...
        </Card>
      </main>
    );
  }

  return (
    <main className="p-8">
      <PageHeader
        title="Audit History"
        subtitle="Track all administrative changes to tournament results"
      />

      {audits.length === 0 ? (
        <Card title="Audit History">
          No audit records found.
        </Card>
      ) : (
        <>
          <Card title="Audit History">
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3">
                      Date
                    </th>

                    <th className="border p-3">
                      Match
                    </th>

                    <th className="border p-3">
                      Previous Score
                    </th>

                    <th className="border p-3">
                      New Score
                    </th>

                    <th className="border p-3">
                      Admin
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {audits.map(
                    (audit) => (
                      <tr
                        key={audit.id}
                        className="text-center"
                      >
                        <td className="border p-3">
                          {formatIrishDate(
                            audit.createdAt
                          )}
                        </td>

                        <td className="border p-3">
                          {audit.match
                            ? `${audit.match.homeTeam.shortCode} v ${audit.match.awayTeam.shortCode}`
                            : `Match ${audit.matchId}`}
                        </td>

                        <td className="border p-3">
                          {audit.previousHome ??
                            "-"}
                          {" - "}
                          {audit.previousAway ??
                            "-"}
                        </td>

                        <td className="border p-3 font-semibold">
                          {audit.newHome}
                          {" - "}
                          {audit.newAway}
                        </td>

                        <td className="border p-3">
                          {audit.adminUser
                            ? `${audit.adminUser.firstName} ${audit.adminUser.lastName}`
                            : audit.adminUserId}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() =>
                setPage(page - 1)
              }
            >
              Previous
            </Button>

            <span>
              Page {page} of {totalPages}
            </span>

            <Button
              variant="secondary"
              disabled={
                page === totalPages
              }
              onClick={() =>
                setPage(page + 1)
              }
            >
              Next
            </Button>
          </div>
        </>
      )}
    </main>
  );
}