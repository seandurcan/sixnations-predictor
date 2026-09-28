import { describe, expect, it } from "vitest";

import { answerSupportQuestion, answerSupportTopic } from "./supportKnowledge";

describe("Perfect XV support interpretation", () => {
  it("recognises finding a league position as a leaderboard intent", () => {
    const result = answerSupportQuestion("how do I find my position in the league");

    expect(result.needsChoice).toBe(false);
    expect(result.matchedTopic).toBe("Finding your leaderboard position");
    expect(result.action).toEqual({
      label: "Open Leaderboard",
      href: "/leaderboard",
    });
  });

  it("uses an approved learned mapping to improve interpretation", () => {
    const result = answerSupportQuestion(
      "where am I sitting in the comp",
      [{ phrase: "where am i sitting in the comp", topicId: "leaderboard-position" }]
    );

    expect(result.matchedTopic).toBe("Finding your leaderboard position");
    expect(result.action?.href).toBe("/leaderboard");
  });

  it("uses an administrator-approved helpdesk clarification for the same wording", () => {
    const result = answerSupportQuestion(
      "how do i see my mini league spot",
      [],
      [{
        phrase: "how do i see my mini league spot",
        topicId: "leaderboard-position",
        answer: "Use the Leaderboard page and choose the competition you entered.",
      }]
    );

    expect(result.answer).toContain("Use the Leaderboard page");
    expect(result.action?.href).toBe("/leaderboard");
  });

  it("keeps authoritative leaderboard rules unchanged", () => {
    const result = answerSupportQuestion("How is the leaderboard ranking decided?");

    expect(result.answer).toContain("1) Points Total");
    expect(result.answer).toContain("2) Correct Wins");
    expect(result.answer).toContain("5) Prediction Delta");
    expect(result.answer).toContain("jointly ranked");
  });

  it("interprets an ambiguous points question and offers likely choices", () => {
    const result = answerSupportQuestion("Can you explain my points?");

    expect(result.needsChoice).toBe(true);
    expect(result.options.length).toBeGreaterThan(1);
    expect(result.options.map((option) => option.id)).toContain("scoring");
  });

  it("returns a quick destination for a selected topic", () => {
    const result = answerSupportTopic("account-details");

    expect(result.action).toEqual({
      label: "Open My Account",
      href: "/account",
    });
  });
});
