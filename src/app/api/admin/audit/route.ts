import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function parseMeta(value: string | null | undefined) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");

    const totalRecords = await prisma.scoreAudit.count();
    const audits = await prisma.scoreAudit.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const enrichedAudits = await Promise.all(
      audits.map(async (audit) => {
        const [match, adminUser, metaSetting] = await Promise.all([
          prisma.match.findUnique({
            where: { id: audit.matchId },
            include: { homeTeam: true, awayTeam: true },
          }),
          prisma.user.findUnique({
            where: { id: audit.adminUserId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          }),
          prisma.systemSetting.findUnique({
            where: { key: "LIVE_SCORE_AUDIT_" + audit.id },
          }),
        ]);

        return {
          ...audit,
          match,
          adminUser,
          liveMeta: parseMeta(metaSetting?.value),
        };
      })
    );

    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      totalRecords,
      totalPages,
      audits: enrichedAudits,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to load audit history";

    if (message === "Authentication required") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (message === "Admin access required") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to load audit history" },
      { status: 500 }
    );
  }
}
