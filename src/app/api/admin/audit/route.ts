import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 100;
const CATEGORIES = ["ALL", "RESULT", "ACCOUNT"] as const;
const ACTIONS = [
  "ALL",
  "RESULT_CHANGED",
  "CORRECT_ACCOUNT",
  "DUPLICATE_REVIEW",
  "MERGE_ACCOUNTS",
  "RESEND_PREDICTION_CONFIRMATION",
  "RESEND_VERIFICATION",
  "SEND_PASSWORD_RESET",
  "DELETE_ACCOUNT",
] as const;
const STATUSES = ["ALL", "SUCCEEDED", "FAILED"] as const;

function filterValue<T extends readonly string[]>(value: string | null, allowed: T): T[number] {
  return allowed.includes(value as T[number]) ? value as T[number] : allowed[0];
}

function parseDate(value: string | null, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function parseMeta(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function safeDetail(value: string | null) {
  if (!value) return null;
  return value
    .slice(0, 240)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]")
    .replace(/\b[A-F0-9]{32,}\b/gi, "[token redacted]");
}

function dateWhere(from: Date | null, to: Date | null) {
  return from || to
    ? { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) }
    : undefined;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const searchParams = new URL(request.url).searchParams;
    const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
    const category = filterValue(searchParams.get("category"), CATEGORIES);
    const action = filterValue(searchParams.get("action"), ACTIONS);
    const status = filterValue(searchParams.get("status"), STATUSES);
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"), true);
    const requestedPage = Number(searchParams.get("page"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const numericQuery = /^\d+$/.test(query) ? Number(query) : null;

    let matchedUserIds: number[] = [];
    let matchedMatchIds: number[] = [];
    if (query) {
      const [users, teams] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              ...(numericQuery ? [{ id: numericQuery }] : []),
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        }),
        prisma.team.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { shortCode: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        }),
      ]);
      matchedUserIds = users.map((user) => user.id);
      const teamIds = teams.map((team) => team.id);
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            ...(numericQuery ? [{ id: numericQuery }] : []),
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
          ],
        },
        select: { id: true },
      });
      matchedMatchIds = matches.map((match) => match.id);
    }

    const createdAt = dateWhere(from, to);
    const scoreEligible = category !== "ACCOUNT"
      && (action === "ALL" || action === "RESULT_CHANGED")
      && status !== "FAILED";
    const accountEligible = category !== "RESULT" && action !== "RESULT_CHANGED";

    const scoreWhere: Prisma.ScoreAuditWhereInput = {
      ...(createdAt ? { createdAt } : {}),
      ...(query ? {
        OR: [
          { adminUserId: { in: matchedUserIds } },
          { matchId: { in: matchedMatchIds } },
        ],
      } : {}),
    };
    const accountWhere: Prisma.AdminUserActionAuditWhereInput = {
      ...(createdAt ? { createdAt } : {}),
      ...(action !== "ALL" ? { action } : {}),
      ...(status !== "ALL" ? { status } : {}),
      ...(query ? {
        OR: [
          { adminUserId: { in: matchedUserIds } },
          { targetUserId: { in: matchedUserIds } },
          ...(numericQuery ? [{ targetUserId: numericQuery }] : []),
        ],
      } : {}),
    };

    const [scoreCount, accountCount] = await Promise.all([
      scoreEligible ? prisma.scoreAudit.count({ where: scoreWhere }) : Promise.resolve(0),
      accountEligible ? prisma.adminUserActionAudit.count({ where: accountWhere }) : Promise.resolve(0),
    ]);
    const total = scoreCount + accountCount;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const candidateLimit = safePage * PAGE_SIZE;

    const [scoreAudits, accountAudits] = await Promise.all([
      scoreEligible ? prisma.scoreAudit.findMany({
        where: scoreWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: candidateLimit,
      }) : Promise.resolve([]),
      accountEligible ? prisma.adminUserActionAudit.findMany({
        where: accountWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: candidateLimit,
      }) : Promise.resolve([]),
    ]);

    const userIds = Array.from(new Set([
      ...scoreAudits.map((audit) => audit.adminUserId),
      ...accountAudits.flatMap((audit) => [audit.adminUserId, audit.targetUserId]),
    ]));
    const matchIds = Array.from(new Set(scoreAudits.map((audit) => audit.matchId)));
    const metaKeys = scoreAudits.map((audit) => `LIVE_SCORE_AUDIT_${audit.id}`);
    const [users, matches, metaSettings] = await Promise.all([
      userIds.length ? prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, deletedAt: true },
      }) : Promise.resolve([]),
      matchIds.length ? prisma.match.findMany({
        where: { id: { in: matchIds } },
        include: { homeTeam: true, awayTeam: true },
      }) : Promise.resolve([]),
      metaKeys.length ? prisma.systemSetting.findMany({
        where: { key: { in: metaKeys } },
        select: { key: true, value: true },
      }) : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map((user) => [user.id, user]));
    const matchMap = new Map(matches.map((match) => [match.id, match]));
    const metaMap = new Map(metaSettings.map((setting) => [setting.key, parseMeta(setting.value)]));
    const administrator = (id: number) => {
      const user = userMap.get(id);
      return user ? { id, name: `${user.firstName} ${user.lastName}` } : { id, name: `Administrator ${id}` };
    };

    const records = [
      ...scoreAudits.map((audit) => {
        const match = matchMap.get(audit.matchId);
        const meta = metaMap.get(`LIVE_SCORE_AUDIT_${audit.id}`);
        return {
          id: `result-${audit.id}`,
          category: "RESULT" as const,
          action: "RESULT_CHANGED" as const,
          status: "SUCCEEDED" as const,
          createdAt: audit.createdAt,
          admin: administrator(audit.adminUserId),
          target: {
            id: audit.matchId,
            label: match ? `${match.homeTeam.shortCode} v ${match.awayTeam.shortCode}` : `Match ${audit.matchId}`,
            previous: `${audit.previousHome ?? "—"} - ${audit.previousAway ?? "—"}`,
            current: `${audit.newHome} - ${audit.newAway}`,
          },
          detail: meta?.source === "API-Sports" ? "Updated by API-Sports live scoring." : "Match result changed.",
        };
      }),
      ...accountAudits.map((audit) => {
        const targetUser = userMap.get(audit.targetUserId);
        const targetName = targetUser
          ? `${targetUser.firstName} ${targetUser.lastName}`
          : `Account ${audit.targetUserId}`;
        return {
          id: `account-${audit.id}`,
          category: "ACCOUNT" as const,
          action: audit.action,
          status: audit.status,
          createdAt: audit.createdAt,
          admin: administrator(audit.adminUserId),
          target: {
            id: audit.targetUserId,
            label: targetUser?.deletedAt ? `Former Participant (account ${audit.targetUserId})` : targetName,
          },
          detail: safeDetail(audit.detail),
        };
      }),
    ]
      .sort((left, right) => {
        const dateDifference = right.createdAt.getTime() - left.createdAt.getTime();
        return dateDifference || right.id.localeCompare(left.id);
      })
      .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return NextResponse.json({
      success: true,
      records,
      pagination: { page: safePage, pageSize: PAGE_SIZE, total, totalPages },
      totals: { resultChanges: scoreCount, accountActions: accountCount },
      filters: {
        query,
        category,
        action,
        status,
        from: searchParams.get("from") ?? "",
        to: searchParams.get("to") ?? "",
      },
    });
  } catch (error) {
    console.error("Admin audit history load failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to load audit history." },
      { status: 500 }
    );
  }
}
