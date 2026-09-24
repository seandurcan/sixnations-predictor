// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(async ({ where }: any) =>
        store.has(where.key) ? { key: where.key, value: store.get(where.key) } : null
      ),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const value = store.has(where.key) ? update.value : create.value;
        store.set(where.key, value);
        return { key: where.key, value };
      }),
    },
  },
}));

import {
  advanceKnockoutWinner,
  getBracketState,
  registerBracketMatch,
  saveBracketDefinition,
} from "./knockoutBracket";

describe("knockout bracket progression", () => {
  beforeEach(() => store.clear());

  it("propagates a completed winner into the configured next-round slot", async () => {
    await saveBracketDefinition(7, {
      name: "Test Knockout",
      source: "Official organiser rules",
      rules: [
        { sourceMatchKey: "QF1", targetMatchKey: "SF1", targetSide: "HOME" },
        { sourceMatchKey: "QF2", targetMatchKey: "SF1", targetSide: "AWAY" },
      ],
    });
    await registerBracketMatch(7, 101, "QF1");
    await registerBracketMatch(7, 102, "QF2");

    await advanceKnockoutWinner(7, 101, 11);
    await advanceKnockoutWinner(7, 102, 22);

    const state = await getBracketState(7);
    expect(state?.matches.QF1.winnerTeamId).toBe(11);
    expect(state?.matches.QF2.winnerTeamId).toBe(22);
    expect(state?.matches.SF1.homeTeamId).toBe(11);
    expect(state?.matches.SF1.awayTeamId).toBe(22);
  });
});
