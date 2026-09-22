import { describe, expect, it } from "vitest";
import {
  buildPredictionReminderEmail,
  buildVerificationReminderEmail,
} from "./reminderTemplates";

describe("lockdown reminder emails", () => {
  it("tells unverified users how to verify and complete their predictions", () => {
    const email = buildVerificationReminderEmail(
      "Sean",
      "https://perfect-xv.org/verify-email?token=test",
      true,
      "One hour"
    );

    expect(email.text).toContain("One hour remains before prediction lockdown");
    expect(email.text).toContain("1. Open the verification link");
    expect(email.text).toContain("3. Open Predictions");
    expect(email.text).toContain("4. Enter a score for every fixture");
  });

  it("tells verified users what remains outstanding", () => {
    const email = buildPredictionReminderEmail(
      "Sean",
      "https://perfect-xv.org",
      false,
      "One week"
    );

    expect(email.text).toContain("One week remains before prediction lockdown");
    expect(email.text).toContain("outstanding match predictions");
    expect(email.text).toContain("https://perfect-xv.org/predictions");
  });
});
