import { describe, expect, it } from "vitest";
import { COMPETITION_INTRO_STORY_PREFIX } from "@/lib/competitionIntroductionStories";

describe("competition introduction stories", () => {
  it("uses a separate key namespace from round reports", () => {
    expect(COMPETITION_INTRO_STORY_PREFIX).toBe("COMPETITION_INTRO_STORY_");
  });
});
