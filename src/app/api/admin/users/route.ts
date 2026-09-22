import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCurrentTournament } from "@/lib/currentTournament";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 40;
const MAX_SEARCH_LENGTH = 120;

const VERIFICATION_FILTERS = ["ALL", "VERIFIED", "UNVERIFIED"] as const;
const ROLE_FILTERS = ["ALL", "ADMIN", "USER"] as const;
const ENTRY_FILTERS = ["ALL", "ENTERED", "NOT_ENTERED"] as const;
const ANNOUNCEMENT_FILTERS = ["ALL", "SUBSCRIBED", "OPTED_OUT"] as const;

function filterValue<T extends readonly string[]>(
  value: string | null,
  allowed: T
): T[number] {
  return allowed.includes(value as T[number]) ? value as T[number] : allowed[0];
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const searchParams = new URL(request.url).searchParams;
    const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
    const verification = filterValue(searchParams.get("verification"), VERIFICATION_FILTERS);
    const role = filterValue(searchParams.get("role"), ROLE_FILTERS);
    const entry = filterValue(searchParams.get("entry"), ENTRY_FILTERS);
    const announcements = filterValue(searchParams.get("announcements"), ANNOUNCEMENT_FILTERS);
    const requestedPage = Number(searchParams.get("page"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const currentCompetition = await getCurrentTournament();
    const entryWhere: Prisma.UserWhereInput = entry === "ALL"
      ? {}
      : !currentCompetition
        ? entry === "ENTERED" ? { id: -1 } : {}
        : {
            competitionEntries: entry === "ENTERED"
              ? { some: { tournamentId: currentCompetition.id, status: "ENTERED" } }
              : { none: { tournamentId: currentCompetition.id, status: "ENTERED" } },
          };

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query ? {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { mobile: { contains: query } },
        ],
      } : {}),
      ...(verification === "VERIFIED" ? { emailVerified: true } : {}),
      ...(verification === "UNVERIFIED" ? { emailVerified: false } : {}),
      ...(role !== "ALL" ? { role } : {}),
      ...(announcements === "SUBSCRIBED" ? { announcementOptOutAt: null } : {}),
      ...(announcements === "OPTED_OUT" ? { announcementOptOutAt: { not: null } } : {}),
      ...entryWhere,
    };

    const activeWhere = { deletedAt: null } satisfies Prisma.UserWhereInput;
    const currentEntrantsWhere = currentCompetition
      ? {
          deletedAt: null,
          competitionEntries: {
            some: { tournamentId: currentCompetition.id, status: "ENTERED" as const },
          },
        }
      : { id: -1 };

    const [total, totalUsers, verifiedUsers, currentEntrants, optedOutUsers] =
      await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ where: activeWhere }),
        prisma.user.count({ where: { ...activeWhere, emailVerified: true } }),
        prisma.user.count({ where: currentEntrantsWhere }),
        prisma.user.count({ where: { ...activeWhere, announcementOptOutAt: { not: null } } }),
      ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const users = await prisma.user.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        emailVerified: true,
        announcementOptOutAt: true,
        createdAt: true,
        competitionEntries: {
          where: { tournamentId: currentCompetition?.id ?? -1 },
          take: 1,
          select: {
            status: true,
            paymentStatus: true,
            predictionsSubmitted: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      users: users.map(({ competitionEntries, ...user }) => ({
        ...user,
        currentEntry: competitionEntries[0] ?? null,
      })),
      pagination: {
        page: safePage,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
      },
      totals: {
        users: totalUsers,
        verified: verifiedUsers,
        currentEntrants,
        optedOut: optedOutUsers,
      },
      currentCompetition: currentCompetition ? {
        id: currentCompetition.id,
        year: currentCompetition.year,
        name: currentCompetition.name,
      } : null,
      filters: { query, verification, role, entry, announcements },
    });
  } catch (error) {
    console.error("Admin user directory load failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to load the user directory." },
      { status: 500 }
    );
  }
}
