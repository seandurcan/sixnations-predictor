import { describe, expect, it } from "vitest";
import { sortCompetitionsBySchedule } from "@/lib/competitionOrder";

describe("competition schedule ordering", () => {
  it("puts the soonest active competition first and future competitions in kickoff order", () => {
    const rows = [
      { id: 4, year: 2026, status: "COMPLETED", firstKickoff: "2026-02-01T14:00:00Z" },
      { id: 3, year: 2028, status: "READY", firstKickoff: "2028-02-01T14:00:00Z" },
      { id: 2, year: 2027, status: "OPEN", firstKickoff: "2027-10-01T10:00:00Z" },
      { id: 1, year: 2027, status: "OPEN", firstKickoff: "2027-02-01T14:00:00Z" },
    ];

    expect(sortCompetitionsBySchedule(rows).map((row) => row.id)).toEqual([
      1,
      2,
      3,
      4,
    ]);
  });

  it("keeps completed and archived competitions after live/future competitions, newest first", () => {
    const rows = [
      { id: 8, year: 2024, status: "ARCHIVED", firstKickoff: "2024-02-01T14:00:00Z" },
      { id: 7, year: 2026, status: "COMPLETED", firstKickoff: "2026-02-01T14:00:00Z" },
      { id: 9, year: 2027, status: "IN_PROGRESS", firstKickoff: "2027-02-01T14:00:00Z" },
    ];

    expect(sortCompetitionsBySchedule(rows).map((row) => row.id)).toEqual([
      9,
      7,
      8,
    ]);
  });
});
