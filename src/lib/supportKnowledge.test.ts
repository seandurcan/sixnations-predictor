import { describe, expect, it } from "vitest";

import { answerSupportQuestion, answerSupportTopic } from "./supportKnowledge";

describe("Perfect XV support interpretation", () => {
  it("recognises finding a league position as a leaderboard intent", () => {
    const result = answerSupportQuestion("how do I find my position in the league");

    expect(result.needsChoice).toBe(false);
    expect(result.matchedTopic).toBe("Finding your leaderboard position");
    expect(result.answer).toContain("Open the Leaderboard");
    expect(result.action).toEqual({
      label: "Open Leaderboard",
      href: "/leaderboard",
    });
  });

  it("answers a clear leaderboard rules question directly", () => {
    const result = answerSupportQuestion("How is the leaderboard ranking decided?");

    expect(result.needsChoice).toBe(false);
    expect(result.answer).toContain("1) Points Total");
    expect(result.answer).toContain("2) Correct Wins");
    expect(result.answer).toContain("5) Prediction Delta");
    expect(result.answer).toContain("jointly ranked");
    expect(result.action?.href).toBe("/leaderboard");
  });

  it("interprets an ambiguous points question and offers likely choices", () => {
    const result = answerSupportQuestion("Can you explain my points?");

    expect(result.needsChoice).toBe(true);
    expect(result.options.length).toBeGreaterThan(1);
    expect(result.options.map((option) => option.id)).toContain("scoring");
    expect(result.action).toBeNull();
  });

  it("offers likely choices for an unclear prediction question", () => {
    const result = answerSupportQuestion("My prediction is not right");

    expect(result.options.length).toBeGreaterThan(0);
    expect(result.options.some((option) =>
      ["predictions", "locking", "completed-results", "prediction-delta"].includes(option.id)
    )).toBe(true);
  });

  it("returns a quick destination when a support option is selected", () => {
    const result = answerSupportTopic("account-details");

    expect(result.needsChoice).toBe(false);
    expect(result.action).toEqual({
      label: "Open My Account",
      href: "/account",
    });
  });

  it("returns the selected approved topic answer", () => {
    const result = answerSupportTopic("prediction-delta");

    expect(result.needsChoice).toBe(false);
    expect(result.answer).toContain("negative when the predicted result is correct");
    expect(result.answer).toContain("positive when the predicted result is wrong");
    expect(result.action?.href).toBe("/predictions");
  });

  it("does not invent an answer for an unknown topic", () => {
    const result = answerSupportQuestion("What colour car should I buy?");

    expect(result.matchedTopic).toBeNull();
    expect(result.needsChoice).toBe(true);
    expect(result.answer).toContain("could not identify");
    expect(result.sources.map((source) => source.href)).toContain("/user-manual");
    expect(result.action).toBeNull();
  });
});
