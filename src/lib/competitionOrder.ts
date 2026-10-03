export const ACTIVE_COMPETITION_STATUSES = [
  "OPEN",
  "LOCKED",
  "IN_PROGRESS",
] as const;

const PREPARATION_STATUSES = ["DRAFT", "READY"] as const;
const HISTORY_STATUSES = ["COMPLETED", "ARCHIVED"] as const;

type CompetitionLike = {
  id: number;
  year: number;
  status: string;
  firstKickoff: Date | string | null;
};

function kickoffTime(value: CompetitionLike["firstKickoff"]) {
  if (!value) return null;
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function group(status: string) {
  if ((ACTIVE_COMPETITION_STATUSES as readonly string[]).includes(status)) return 0;
  if ((PREPARATION_STATUSES as readonly string[]).includes(status)) return 1;
  if ((HISTORY_STATUSES as readonly string[]).includes(status)) return 2;
  return 3;
}

export function sortCompetitionsBySchedule<T extends CompetitionLike>(
  competitions: T[]
): T[] {
  return [...competitions].sort((a, b) => {
    const aGroup = group(a.status);
    const bGroup = group(b.status);

    if (aGroup !== bGroup) return aGroup - bGroup;

    const aKickoff = kickoffTime(a.firstKickoff);
    const bKickoff = kickoffTime(b.firstKickoff);

    if (aGroup === 2) {
      if (aKickoff !== null && bKickoff !== null && aKickoff !== bKickoff) {
        return bKickoff - aKickoff;
      }
      if (aKickoff !== null && bKickoff === null) return -1;
      if (aKickoff === null && bKickoff !== null) return 1;
      return b.year - a.year || b.id - a.id;
    }

    if (aKickoff !== null && bKickoff !== null && aKickoff !== bKickoff) {
      return aKickoff - bKickoff;
    }
    if (aKickoff !== null && bKickoff === null) return -1;
    if (aKickoff === null && bKickoff !== null) return 1;

    return a.year - b.year || a.id - b.id;
  });
}
