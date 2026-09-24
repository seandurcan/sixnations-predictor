import { prisma } from "@/lib/prisma";

export const CURRENT_TOURNAMENT_SETTING = "CURRENT_TOURNAMENT_ID";
export const ACTIVE_TOURNAMENT_STATUSES = ["OPEN", "LOCKED", "IN_PROGRESS"] as const;
export const VIEWABLE_TOURNAMENT_STATUSES = [
  ...ACTIVE_TOURNAMENT_STATUSES,
  "COMPLETED",
  "ARCHIVED",
] as const;

type ActiveStatus = typeof ACTIVE_TOURNAMENT_STATUSES[number];
type ViewableStatus = typeof VIEWABLE_TOURNAMENT_STATUSES[number];

function isActiveStatus(status: string) {
  return ACTIVE_TOURNAMENT_STATUSES.includes(status as ActiveStatus);
}

function isViewableStatus(status: string) {
  return VIEWABLE_TOURNAMENT_STATUSES.includes(status as ViewableStatus);
}

async function selectedTournament() {
  const selected = await prisma.systemSetting.findUnique({
    where: { key: CURRENT_TOURNAMENT_SETTING },
  });

  const selectedId = Number(selected?.value);
  if (!Number.isInteger(selectedId) || selectedId <= 0) return null;

  return prisma.tournament.findUnique({
    where: { id: selectedId },
  });
}

export async function getCurrentTournament() {
  const selected = await selectedTournament();
  if (selected && isActiveStatus(selected.status)) {
    return selected;
  }

  return prisma.tournament.findFirst({
    where: { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
    orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
  });
}

export async function getCurrentViewableTournament() {
  const selected = await selectedTournament();
  if (selected && isViewableStatus(selected.status)) {
    return selected;
  }

  const active = await prisma.tournament.findFirst({
    where: { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
    orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
  });
  if (active) return active;

  return prisma.tournament.findFirst({
    where: { status: "COMPLETED" },
    orderBy: [{ firstKickoff: "desc" }, { id: "desc" }],
  });
}

export async function getActiveTournaments() {
  return prisma.tournament.findMany({
    where: { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
    orderBy: [{ firstKickoff: "asc" }, { year: "asc" }, { id: "asc" }],
  });
}

export async function getTournamentByIdOrCurrent(tournamentId?: number | null) {
  if (Number.isInteger(tournamentId) && Number(tournamentId) > 0) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(tournamentId) },
    });
    if (tournament && isActiveStatus(tournament.status)) {
      return tournament;
    }
  }
  return getCurrentTournament();
}

export async function getViewableTournamentByIdOrCurrent(
  tournamentId?: number | null
) {
  if (Number.isInteger(tournamentId) && Number(tournamentId) > 0) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(tournamentId) },
    });
    if (tournament && isViewableStatus(tournament.status)) {
      return tournament;
    }
  }
  return getCurrentViewableTournament();
}

export async function requireCurrentTournament() {
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No current competition is configured");
  return tournament;
}

export async function requireCurrentViewableTournament() {
  const tournament = await getCurrentViewableTournament();
  if (!tournament) throw new Error("No viewable competition is configured");
  return tournament;
}
