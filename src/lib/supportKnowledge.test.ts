import { describe, expect, it } from "vitest";

import { answerSupportQuestion } from "./supportKnowledge";

describe("answerSupportQuestion", () => {
  it("returns the locked leaderboard hierarchy", () => {
    const result = answerSupportQuestion("How is the leaderboard ranked?");

    expect(result.answer).toContain("1) Points Total");
    expect(result.answer).toContain("2) Correct Wins");
    expect(result.answer).toContain("5) Prediction Delta");
    expect(result.answer).toContain("jointly ranked");
  });

  it("explains signed Prediction Delta", () => {
    const result = answerSupportQuestion("Why is my Prediction Delta negative?");

    expect(result.answer).toContain("negative when the predicted result is correct");
    expect(result.answer).toContain("positive when the predicted result is wrong");
  });

  it("does not invent an answer for an unknown topic", () => {
    const result = answerSupportQuestion("What colour car should I buy?");

    expect(result.matchedTopic).toBeNull();
    expect(result.answer).toContain("rather not guess");
    expect(result.sources.map((source) => source.href)).toContain("/user-manual");
  });
});
