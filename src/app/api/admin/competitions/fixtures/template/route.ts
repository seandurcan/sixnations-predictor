import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { formatCompetitionTitle } from "@/lib/competitionTitle";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const tournamentId = Number(request.nextUrl.searchParams.get("tournamentId"));
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json(
      { success: false, error: "Select a valid draft competition." },
      { status: 400 }
    );
  }

  const competition = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, year: true, status: true },
  });
  if (!competition) {
    return NextResponse.json(
      { success: false, error: "Competition not found." },
      { status: 404 }
    );
  }
  if (competition.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Fixture templates are only available for draft competitions." },
      { status: 409 }
    );
  }

  const headers = [
    "Round",
    "Date",
    "Kick-off",
    "Home Team",
    "Away Team",
    "Stadium",
    "City",
    "Country",
  ];
  const example = [
    "1",
    `${competition.year}-09-01`,
    "19:35",
    "Home Team",
    "Away Team",
    "Stadium Name",
    "City",
    "Country",
  ];

  const csv = [
    headers.map(csvEscape).join(","),
    example.map(csvEscape).join(","),
  ].join("\r\n");

  const safeName = formatCompetitionTitle(competition.name, competition.year)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${safeName || "competition"}-fixture-template.csv"`,
      "cache-control": "no-store",
    },
  });
}
