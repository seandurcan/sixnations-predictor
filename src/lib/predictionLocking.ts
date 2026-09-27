import {
  isSixNationsCompetition,
  normaliseCompetitionName,
} from "@/lib/fixtureDiscovery";

export type PredictionLockMode = "TOURNAMENT" | "STAGE";

export type StageFixture = {
  round: number;
  kickoffTime: Date | string;
};

export function predictionLockMode(competitionName: string): PredictionLockMode {
  return isSixNationsCompetition(competitionName) ? "TOURNAMENT" : "STAGE";
}

export function predictionStageKey(
  competitionName: string,
  round: number
): string {
  const name = normaliseCompetitionName(competitionName);

  if (isSixNationsCompetition(competitionName)) {
    return "TOURNAMENT";
  }

  if (name.includes("unitedrugbychampionship")) {
    return round <= 18 ? "REGULAR_SEASON" : `ROUND_${round}`;
  }

  if (name.includes("challengecup")) {
    return round <= 4 ? "POOL_STAGE" : `ROUND_${round}`;
  }

  if (name.includes("rugbyworldcup")) {
    return round <= 5 ? "POOL_STAGE" : `ROUND_${round}`;
  }

  // Unknown competition formats default to one competition-wide stage.
  // This is deliberately safer than silently reverting to fixture-by-fixture locking.
  return "TOURNAMENT";
}

function parsedDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fixturePredictionLockAt(input: {
  competitionName: string;
  tournamentPredictionLockAt?: Date | string | null;
  kickoffTime: Date | string;
  matchRound?: number | null;
  tournamentMatches?: StageFixture[];
}) {
  const targetRound =
    Number.isInteger(input.matchRound) && Number(input.matchRound) > 0
      ? Number(input.matchRound)
      : 1;

  const stageKey = predictionStageKey(input.competitionName, targetRound);

  if (stageKey === "TOURNAMENT") {
    const configured = parsedDate(input.tournamentPredictionLockAt);
    if (configured) return configured;
  }

  const stageMatches = (input.tournamentMatches ?? []).filter(
    (match) => predictionStageKey(input.competitionName, match.round) === stageKey
  );

  const firstStageKickoff = stageMatches
    .map((match) => parsedDate(match.kickoffTime))
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (firstStageKickoff) {
    return new Date(firstStageKickoff.getTime() - 60_000);
  }

  const kickoff = parsedDate(input.kickoffTime);
  if (!kickoff) return null;

  // Fallback only when the caller has not supplied the competition fixture set.
  return new Date(kickoff.getTime() - 60_000);
}

export function fixturePredictionIsLocked(
  input: Parameters<typeof fixturePredictionLockAt>[0],
  now = new Date()
) {
  const deadline = fixturePredictionLockAt(input);
  return deadline ? deadline.getTime() <= now.getTime() : false;
}
