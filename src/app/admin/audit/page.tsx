"use client";

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading audit history...
      </div>
    );
  }

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-6">
        Audit History
      </h1>

      {audits.length === 0 ? (
        <div className="border rounded p-6">
          No audit records found.
        </div>
      ) : (
        <>
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
                        {new Date(
                          audit.createdAt
                        ).toLocaleString()}
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

          <div className="flex items-center justify-center gap-4 mt-6">

            <button
              disabled={page === 1}
              onClick={() =>
                setPage(page - 1)
              }
              className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={
                page === totalPages
              }
              onClick={() =>
                setPage(page + 1)
              }
              className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
            >
              Next
            </button>

          </div>
        </>
      )}

    </main>
  );
}