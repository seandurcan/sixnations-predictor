import { prisma } from "@/lib/prisma";

export const CURRENT_TOURNAMENT_SETTING = "CURRENT_TOURNAMENT_ID";
export const ACTIVE_TOURNAMENT_STATUSES = ["OPEN", "LOCKED", "IN_PROGRESS"] as const;

export async function getCurrentTournament() {
  const selected = await prisma.systemSetting.findUnique({
    where: { key: CURRENT_TOURNAMENT_SETTING },
  });

  const selectedId = Number(selected?.value);
  if (Number.isInteger(selectedId) && selectedId > 0) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: selectedId },
    });
    if (tournament && ACTIVE_TOURNAMENT_STATUSES.includes(tournament.status as typeof ACTIVE_TOURNAMENT_STATUSES[number])) {
      return tournament;
    }
  }

  return prisma.tournament.findFirst({
    where: { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
    orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
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
    if (
      tournament &&
      ACTIVE_TOURNAMENT_STATUSES.includes(
        tournament.status as typeof ACTIVE_TOURNAMENT_STATUSES[number]
      )
    ) {
      return tournament;
    }
  }
  return getCurrentTournament();
}

export async function requireCurrentTournament() {
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No current competition is configured");
  return tournament;
}
