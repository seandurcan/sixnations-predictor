import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    emailVerification: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    tournament: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { processReminders } from "./reminderService";

describe("processReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.emailVerification.create).mockResolvedValue({} as never);
    vi.mocked(resend.emails.send).mockResolvedValue({
      data: { id: "email-id" },
      error: null,
    } as never);
  });

  it("does not label an ordinary repeat verification reminder as final", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: 6,
        firstName: "Sean",
        email: "sean+testuser6@gmail.com",
        emailVerified: false,
        deletedAt: null,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        lastVerificationReminderAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    ] as never);

    const result = await processReminders("verification");

    expect(result.sentCount).toBe(1);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "sean+testuser6@gmail.com",
        subject: "Reminder: Please verify your email address",
      })
    );
  });
});
