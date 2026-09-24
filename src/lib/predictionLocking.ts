import { isSixNationsCompetition } from "@/lib/fixtureDiscovery";

export type PredictionLockMode = "TOURNAMENT" | "MATCH";

export function predictionLockMode(competitionName: string): PredictionLockMode {
  return isSixNationsCompetition(competitionName) ? "TOURNAMENT" : "MATCH";
}

export function fixturePredictionLockAt(input: {
  competitionName: string;
  tournamentPredictionLockAt?: Date | string | null;
  kickoffTime: Date | string;
}) {
  if (predictionLockMode(input.competitionName) === "TOURNAMENT") {
    if (!input.tournamentPredictionLockAt) return null;
    const deadline = new Date(input.tournamentPredictionLockAt);
    return Number.isNaN(deadline.getTime()) ? null : deadline;
  }

  const kickoff = new Date(input.kickoffTime);
  if (Number.isNaN(kickoff.getTime())) return null;
  return new Date(kickoff.getTime() - 60_000);
}

export function fixturePredictionIsLocked(
  input: Parameters<typeof fixturePredictionLockAt>[0],
  now = new Date()
) {
  const deadline = fixturePredictionLockAt(input);
  return deadline ? deadline.getTime() <= now.getTime() : false;
}
