import { describe, expect, it } from "vitest";
import {
  dueWeeklyReminder,
  finalReminderAt,
  shouldScheduleFinalReminder,
  weeklyReminderMilestones,
} from "@/lib/reminders/schedule";

describe("competition reminder schedule", () => {
  const kickoff = new Date("2027-02-05T20:10:00.000Z");

  it("starts four weeks before kickoff and repeats weekly", () => {
    expect(
      weeklyReminderMilestones(kickoff).map((item) => [
        item.daysBefore,
        item.targetAt.toISOString(),
      ])
    ).toEqual([
      [28, "2027-01-08T20:10:00.000Z"],
      [21, "2027-01-15T20:10:00.000Z"],
      [14, "2027-01-22T20:10:00.000Z"],
      [7, "2027-01-29T20:10:00.000Z"],
    ]);
  });

  it("finds a weekly reminder during the daily cron grace window", () => {
    expect(
      dueWeeklyReminder(
        kickoff,
        new Date("2027-01-09T08:00:00.000Z")
      )?.daysBefore
    ).toBe(28);
  });

  it("places the final reminder exactly two hours before first kickoff", () => {
    expect(finalReminderAt(kickoff).toISOString()).toBe(
      "2027-02-05T18:10:00.000Z"
    );
  });

  it("lets the daily scheduler queue an exact final reminder in advance", () => {
    expect(
      shouldScheduleFinalReminder(
        kickoff,
        new Date("2027-02-04T18:30:00.000Z")
      )
    ).toBe(true);
  });
});
