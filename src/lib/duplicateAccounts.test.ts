import { describe, expect, it } from "vitest";
import { duplicateReasons, findDuplicateCandidates } from "./duplicateAccounts";

const user = (id: number, firstName: string, lastName: string, email: string, mobile = "") => ({
  id, firstName, lastName, email, mobile,
});

describe("duplicate account matching", () => {
  it("normalises Irish mobile formats and accented names", () => {
    expect(duplicateReasons(
      user(1, "Seán", "Power", "one@example.com", "+353 87 920 0917"),
      user(2, "Sean", "Power", "two@example.com", "0879200917")
    )).toEqual(expect.arrayContaining(["MOBILE", "EXACT_NAME"]));
  });

  it("flags a one-character name variation but not unrelated people", () => {
    expect(duplicateReasons(
      user(1, "Caroline", "Lister", "one@example.com"),
      user(2, "Caroline", "Litster", "two@example.com")
    )).toContain("SIMILAR_NAME");
    expect(duplicateReasons(
      user(1, "John", "Ryan", "one@example.com"),
      user(2, "John", "Horan", "two@example.com")
    )).toEqual([]);
  });

  it("returns each candidate pair once with lower account first", () => {
    const candidates = findDuplicateCandidates([
      user(9, "Eva", "Hourihan", "same@example.com"),
      user(3, "Eva", "Hourihan", "SAME@example.com"),
    ]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].lowerUser.id).toBe(3);
    expect(candidates[0].higherUser.id).toBe(9);
  });
});
