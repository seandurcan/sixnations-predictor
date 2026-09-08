import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FixturesPage from "./page";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FixturesPage", () => {
  it("lists fixtures in match order with game details", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 2,
          matchNumber: 2,
          round: 1,
          kickoffTime: "2027-02-06T14:10:00Z",
          venue: "Murrayfield",
          city: "Edinburgh",
          country: "Scotland",
          referee: "Test Referee",
          completed: false,
          homeTeam: { name: "Scotland", shortCode: "SCO" },
          awayTeam: { name: "Italy", shortCode: "ITA" },
        },
        {
          id: 1,
          matchNumber: 1,
          round: 1,
          kickoffTime: "2027-02-05T20:10:00Z",
          venue: "Aviva Stadium",
          city: "Dublin",
          country: "Ireland",
          completed: false,
          homeTeam: { name: "Ireland", shortCode: "IRE" },
          awayTeam: { name: "England", shortCode: "ENG" },
        },
      ],
    });

    render(<FixturesPage />);

    expect(await screen.findByRole("heading", { name: "Fixtures" })).toBeInTheDocument();
    expect(screen.getByText("Ireland v England")).toBeInTheDocument();
    expect(screen.getByText("Aviva Stadium, Dublin, Ireland")).toBeInTheDocument();
    expect(screen.getByText("Referee: Test Referee")).toBeInTheDocument();

    const matchLabels = screen.getAllByText(/Match \d · Round 1/);
    expect(matchLabels[0]).toHaveTextContent("Match 1");
    expect(matchLabels[1]).toHaveTextContent("Match 2");
  });

  it("shows an error instead of returning to the landing page", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    render(<FixturesPage />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load fixtures.")).toBeInTheDocument();
    });
  });
});
