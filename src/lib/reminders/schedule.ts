export const WEEKLY_REMINDER_OFFSETS_DAYS = [28, 21, 14, 7] as const;

export type WeeklyReminderMilestone = {
  daysBefore: number;
  label: string;
  targetAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function weeklyReminderMilestones(
  firstKickoff: Date
): WeeklyReminderMilestone[] {
  return WEEKLY_REMINDER_OFFSETS_DAYS.map((daysBefore) => ({
    daysBefore,
    label:
      daysBefore === 28
        ? "Four weeks"
        : daysBefore === 21
          ? "Three weeks"
          : daysBefore === 14
            ? "Two weeks"
            : "One week",
    targetAt: new Date(firstKickoff.getTime() - daysBefore * DAY_MS),
  }));
}

export function dueWeeklyReminder(
  firstKickoff: Date,
  now: Date,
  graceHours = 36
): WeeklyReminderMilestone | null {
  if (now >= firstKickoff) return null;

  const graceMs = graceHours * 60 * 60 * 1000;
  return (
    weeklyReminderMilestones(firstKickoff)
      .filter(
        (milestone) =>
          now.getTime() >= milestone.targetAt.getTime() &&
          now.getTime() < milestone.targetAt.getTime() + graceMs
      )
      .sort((a, b) => b.targetAt.getTime() - a.targetAt.getTime())[0] ?? null
  );
}

export function finalReminderAt(firstKickoff: Date) {
  return new Date(firstKickoff.getTime() - 2 * 60 * 60 * 1000);
}

export function shouldScheduleFinalReminder(
  firstKickoff: Date,
  now: Date,
  lookAheadHours = 30
) {
  const target = finalReminderAt(firstKickoff);
  return (
    target.getTime() > now.getTime() &&
    target.getTime() <= now.getTime() + lookAheadHours * 60 * 60 * 1000
  );
}
