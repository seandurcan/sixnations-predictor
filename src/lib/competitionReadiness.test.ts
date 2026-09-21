import { describe, expect, it } from "vitest";
import { SIX_NATIONS_TEAM_NAMES } from "./fixtureImport";
import { validateCompetitionReadiness } from "./competitionReadiness";

function readyCompetition() {
  const matches = [];
  let matchNumber = 1;
  for (let home = 0; home < SIX_NATIONS_TEAM_NAMES.length; home++) {
    for (let away = home + 1; away < SIX_NATIONS_TEAM_NAMES.length; away++) {
      matches.push({
        round: Math.floor((matchNumber - 1) / 3) + 1,
        matchNumber,
        kickoffTime: new Date(Date.UTC(2028, 1, matchNumber, 14)),
        venue: `Stadium ${matchNumber}`,
        city: "City",
        country: "Country",
        homeTeam: { name: SIX_NATIONS_TEAM_NAMES[home] },
        awayTeam: { name: SIX_NATIONS_TEAM_NAMES[away] },
      });
      matchNumber++;
    }
  }
  return {
    year: 2028,
    firstKickoff: new Date("2028-02-01T14:00:00.000Z"),
    predictionLockAt: new Date("2028-02-01T13:59:00.000Z"),
    matches,
  };
}

describe("validateCompetitionReadiness", () => {
  it("accepts a complete and correctly timed competition", () => {
    expect(validateCompetitionReadiness(readyCompetition())).toEqual([]);
  });

  it("rejects a competition with a missing fixture", () => {
    const competition = readyCompetition();
    competition.matches.pop();

    expect(validateCompetitionReadiness(competition)).toContain(
      "Exactly 15 fixtures are required; received 14."
    );
  });

  it("rejects an incorrect prediction lock", () => {
    const competition = readyCompetition();
    competition.predictionLockAt = competition.firstKickoff;

    expect(validateCompetitionReadiness(competition)).toContain(
      "Prediction locking must be one minute before the first kickoff."
    );
  });
});
