export function buildVerificationReminderEmail(
  firstName: string,
  appUrl: string,
  finalReminder = false
) {
  const subject = finalReminder
    ? "Final Reminder: Verify your email address"
    : "Reminder: Please verify your email address";

  const text = `Hi ${firstName},\n\nPlease verify your email address to ensure your account remains active.\n\n${appUrl}/verify\n\nBest regards,\nThe Competition Team`;

  return { subject, text };
}

export function buildPredictionReminderEmail(
  firstName: string,
  appUrl: string,
  finalReminder = false
) {
  const subject = finalReminder
    ? "Final Reminder: Submit your predictions!"
    : "Reminder: Submit your match predictions!";

  const text = `Hi ${firstName},\n\nYou still have outstanding match predictions to submit.\n\n${appUrl}/predictions\n\nBest regards,\nThe Competition Team`;

  return { subject, text };
}