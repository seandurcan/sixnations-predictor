import { prisma } from "@/lib/prisma";

export const CURRENT_TOURNAMENT_SETTING = "CURRENT_TOURNAMENT_ID";

export async function getCurrentTournament() {
  const selected = await prisma.systemSetting.findUnique({
    where: { key: CURRENT_TOURNAMENT_SETTING },
  });

  const selectedId = Number(selected?.value);
  if (Number.isInteger(selectedId) && selectedId > 0) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: selectedId },
    });
    if (tournament) return tournament;
  }

  return prisma.tournament.findFirst({
    where: { status: { in: ["OPEN", "LOCKED", "IN_PROGRESS"] } },
    orderBy: [{ firstKickoff: "asc" }, { id: "asc" }],
  });
}

export async function requireCurrentTournament() {
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No current competition is configured");
  return tournament;
}
