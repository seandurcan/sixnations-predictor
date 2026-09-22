export function buildVerificationReminderEmail(
  firstName: string,
  verificationUrl: string,
  finalReminder = false,
  timeRemaining?: string
) {
  const subject = finalReminder
    ? "Final Reminder: Verify your email address"
    : "Reminder: Please verify your email address";

  const timing = timeRemaining
    ? `${timeRemaining} remains before prediction lockdown.\n\n`
    : "";
  const text = `Hi ${firstName},\n\n${timing}Your account is not yet verified, so you cannot complete your tournament entry.\n\nHow to finish:\n1. Open the verification link below.\n2. Sign in to Perfect XV.\n3. Open Predictions.\n4. Enter a score for every fixture and save your predictions.\n\n${verificationUrl}\n\nThis verification link expires in 1 hour.\n\nBest regards,\nThe Perfect XV Team`;

  return { subject, text };
}

export function buildPredictionReminderEmail(
  firstName: string,
  appUrl: string,
  finalReminder = false,
  timeRemaining?: string
) {
  const subject = finalReminder
    ? "Final Reminder: Submit your predictions!"
    : "Reminder: Submit your match predictions!";

  const timing = timeRemaining
    ? `${timeRemaining} remains before prediction lockdown.\n\n`
    : "";
  const text = `Hi ${firstName},\n\n${timing}You still have outstanding match predictions to submit.\n\nOpen Predictions, enter a score for every remaining fixture, and save:\n${appUrl}/predictions\n\nBest regards,\nThe Competition Team`;

  return { subject, text };
}
