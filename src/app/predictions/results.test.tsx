import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PredictionsPage from "./page";

vi.mock("@/hooks/useActiveCompetitions", () => ({
  useActiveCompetitions: () => ({
    competitions: [{
      id: 7, name: "Six Nations", year: 2027, status: "IN_PROGRESS",
      entry: { status: "ENTERED", paymentStatus: "COMPLETED" },
    }],
    selectedCompetitionId: 7,
    setSelectedCompetitionId: vi.fn(),
    loadingCompetitions: false,
  }),
}));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function mockResults(matches: unknown[], totals = {}) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
    ok: true,
    json: async () => url === "/api/auth/me"
      ? { authenticated: true, user: { firstName: "Sean" } }
      : { totalPoints: 0, correctResults: 0, exactScores: 0,
          correctMargins: 0, cumulativeError: 0, matches, ...totals },
  })));
}

describe("post-kick-off results", () => {
  it("groups Match Points with scoring cards and shows leaderboard totals below all matches", async () => {
    const match = {
      id: 1, round: 1, kickoffTime: "2027-02-06T15:00:00Z",
      homeTeam: { name: "Ireland", shortCode: "IRE" },
      awayTeam: { name: "France", shortCode: "FRA" },
      actualHomeScore: 24, actualAwayScore: 10,
      prediction: { predictedHomeScore: 24, predictedAwayScore: 10,
        pointsAwarded: 1.5, correctResult: true, correctMargin: true,
        exactScore: true, errorValue: 0, differenceScore: 0 },
    };
    mockResults([match, { ...match, id: 2, prediction: null }], {
      totalPoints: 4.5, correctResults: 4, exactScores: 1,
      correctMargins: 2, cumulativeError: 18,
    });
    render(<PredictionsPage />);
    await screen.findByRole("heading", { name: "Completed Matches" });
    const points = screen.getAllByText("Match Points");
    points.forEach((label, index) => {
      const card = label.parentElement!;
      const resultCard = screen.getAllByText("Correct Result Points")[index].parentElement!;
      expect(card.parentElement).toBe(resultCard.parentElement);
      expect(card.className).toBe(resultCard.className);
      expect(within(card).getByText(index === 0 ? "1.5" : "0")).toBeInTheDocument();
    });
    const totals = screen.getByRole("heading", { name: "Leaderboard Totals" }).parentElement!;
    expect(within(totals).getAllByRole("term").map((el) => el.textContent)).toEqual([
      "Total Points", "Correct Results", "Perfect Scores", "Correct Margins", "Aggregate Score Error",
    ]);
    expect(within(totals).getAllByRole("definition").map((el) => el.textContent)).toEqual(["4.5", "4", "1", "2", "18"]);
    expect(points[1].compareDocumentPosition(totals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows zero totals when there are no completed matches", async () => {
    mockResults([]);
    render(<PredictionsPage />);
    await screen.findByText("No completed matches are available yet.");
    expect(screen.getAllByRole("definition").map((el) => el.textContent)).toEqual(["0", "0", "0", "0", "0"]);
    expect(screen.queryByText("Match Points")).not.toBeInTheDocument();
  });
});
