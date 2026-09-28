import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn().mockResolvedValue({ id: 1 }) }));
vi.mock("@/lib/liveScoring", () => ({ syncLiveScores: vi.fn() }));
vi.mock("@/lib/currentTournament", () => ({
  VIEWABLE_TOURNAMENT_STATUSES: ["IN_PROGRESS"],
  getViewableTournamentByIdOrCurrent: vi.fn().mockResolvedValue({ id: 7 }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  tournament: { findFirst: vi.fn() },
  competitionEntry: { findUnique: vi.fn() },
  match: { findMany: vi.fn() },
  prediction: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
  leaderboardSnapshot: { findFirst: vi.fn().mockResolvedValue(null) },
} }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.tournament.findFirst).mockResolvedValue({ id: 7 } as never);
  vi.mocked(prisma.competitionEntry.findUnique).mockResolvedValue({ status: "ENTERED", paymentStatus: "COMPLETED" } as never);
});

it.each([true, false])("returns the same entrant metrics as the leaderboard (completed results: %s)", async (hasResults) => {
  const predictions = hasResults ? [
    { matchId: 10, predictedHomeScore: 24, predictedAwayScore: 17, pointsAwarded: 6, correctResult: true, exactScore: true, correctMargin: true, errorValue: 0, differenceScore: 0 },
    { matchId: 11, predictedHomeScore: 20, predictedAwayScore: 13, pointsAwarded: 1, correctResult: true, exactScore: false, correctMargin: false, errorValue: 9, differenceScore: -3 },
    { matchId: 12, predictedHomeScore: 10, predictedAwayScore: 18, pointsAwarded: 0, correctResult: false, exactScore: false, correctMargin: false, errorValue: 7, differenceScore: 3 },
  ] : [];
  vi.mocked(prisma.match.findMany).mockResolvedValue(predictions.map((p, index) => ({
    id: p.matchId,
    matchNumber: index + 1,
    round: 1,
    kickoffTime: new Date("2027-02-01"),
    updatedAt: new Date("2027-02-01"),
    actualHomeScore: index === 0 ? 24 : index === 1 ? 24 : 24,
    actualAwayScore: index === 0 ? 17 : index === 1 ? 17 : 17,
    homeTeam: { name: "Home", shortCode: "HOM" },
    awayTeam: { name: "Away", shortCode: "AWY" },
  })) as never);
  vi.mocked(prisma.prediction.findMany).mockResolvedValue(predictions as never);
  vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 1, predictions }] as never);

  const results = await (await GET(new Request("http://localhost/api/predictions/results?tournamentId=7"))).json();
  const leaderboard = await (await getLeaderboard(new Request("http://localhost/api/leaderboard?tournamentId=7"))).json();
  for (const metric of ["totalPoints", "correctResults", "exactScores", "correctMargins", "cumulativeError"]) {
    expect(results[metric]).toBe(leaderboard.data[0][metric]);
  }
  expect(results.cumulativeError).toBe(hasResults ? 16 : 0);
  expect(results.cumulativePredictionDelta).toBe(hasResults ? 8 : 0);
  expect(results.leaderboardPosition).toBe(leaderboard.data[0].rank);
});
