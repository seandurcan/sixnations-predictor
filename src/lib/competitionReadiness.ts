import { prepareFixtureImport } from "@/lib/fixtureImport";

export type CompetitionReadinessInput = {
  year: number;
  firstKickoff: Date | null;
  predictionLockAt: Date | null;
  matches: Array<{
    round: number;
    matchNumber: number;
    kickoffTime: Date;
    venue: string;
    city: string | null;
    country: string | null;
    homeTeam: { name: string };
    awayTeam: { name: string };
  }>;
};

export function validateCompetitionReadiness(
  competition: CompetitionReadinessInput
) {
  const prepared = prepareFixtureImport(
    competition.matches.map((match) => ({
      kickoffTime: match.kickoffTime.toISOString(),
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      venue: match.venue,
      city: match.city,
      country: match.country,
    })),
    competition.year
  );
  const errors = [...prepared.errors];

  if (prepared.errors.length === 0) {
    const orderedMatches = [...competition.matches].sort(
      (a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime()
    );
    orderedMatches.forEach((match, index) => {
      const expectedMatchNumber = index + 1;
      const expectedRound = Math.floor(index / 3) + 1;
      if (match.matchNumber !== expectedMatchNumber) {
        errors.push(
          `Fixture ${expectedMatchNumber} has match number ${match.matchNumber}; expected ${expectedMatchNumber}.`
        );
      }
      if (match.round !== expectedRound) {
        errors.push(
          `Fixture ${expectedMatchNumber} is in round ${match.round}; expected round ${expectedRound}.`
        );
      }
    });

    const expectedFirstKickoff = orderedMatches[0].kickoffTime;
    if (
      !competition.firstKickoff ||
      competition.firstKickoff.getTime() !== expectedFirstKickoff.getTime()
    ) {
      errors.push("The competition first kickoff does not match its earliest fixture.");
    }

    const expectedLockAt = new Date(expectedFirstKickoff.getTime() - 60_000);
    if (
      !competition.predictionLockAt ||
      competition.predictionLockAt.getTime() !== expectedLockAt.getTime()
    ) {
      errors.push("Prediction locking must be one minute before the first kickoff.");
    }
  }

  return [...new Set(errors)];
}
