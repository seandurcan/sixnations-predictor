CREATE TABLE "PerfectXvInvitation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "normalisedEmail" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "invitedById" INTEGER NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "unsubscribeTokenHash" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "PerfectXvInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerfectXvInvitation_normalisedEmail_key"
ON "PerfectXvInvitation"("normalisedEmail");

CREATE UNIQUE INDEX "PerfectXvInvitation_unsubscribeTokenHash_key"
ON "PerfectXvInvitation"("unsubscribeTokenHash");

CREATE INDEX "PerfectXvInvitation_invitedById_invitedAt_idx"
ON "PerfectXvInvitation"("invitedById", "invitedAt");

CREATE INDEX "PerfectXvInvitation_unsubscribedAt_idx"
ON "PerfectXvInvitation"("unsubscribedAt");

ALTER TABLE "PerfectXvInvitation"
ADD CONSTRAINT "PerfectXvInvitation_invitedById_fkey"
FOREIGN KEY ("invitedById") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
