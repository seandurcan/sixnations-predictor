ALTER TYPE "AnnouncementDeliveryStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "AnnouncementDeliveryStatus" ADD VALUE IF NOT EXISTS 'SENDING';
ALTER TYPE "AnnouncementDeliveryStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';

ALTER TABLE "AnnouncementCampaign"
  ADD COLUMN "confirmedByUserId" INTEGER,
  ADD COLUMN "recipientCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "AnnouncementDelivery"
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "unsubscribeToken" TEXT,
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "AnnouncementDelivery_dedupeKey_key"
  ON "AnnouncementDelivery"("dedupeKey");
