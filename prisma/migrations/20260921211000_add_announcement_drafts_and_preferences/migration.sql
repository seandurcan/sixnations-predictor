CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL_VERIFIED', 'CURRENT_ENTRANTS', 'NO_CURRENT_ENTRY');
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'READY', 'SENDING', 'SENT', 'CANCELLED');
CREATE TYPE "AnnouncementDeliveryType" AS ENUM ('TEST', 'BULK');
CREATE TYPE "AnnouncementDeliveryStatus" AS ENUM ('SENT', 'FAILED');

ALTER TABLE "User" ADD COLUMN "announcementOptOutAt" TIMESTAMP(3);

CREATE TABLE "AnnouncementCampaign" (
  "id" SERIAL NOT NULL,
  "subject" TEXT NOT NULL,
  "heading" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionLabel" TEXT,
  "actionUrl" TEXT,
  "audience" "AnnouncementAudience" NOT NULL,
  "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
  "createdByUserId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnnouncementCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnouncementDelivery" (
  "id" SERIAL NOT NULL,
  "campaignId" INTEGER NOT NULL,
  "recipientUserId" INTEGER,
  "recipientEmail" TEXT NOT NULL,
  "deliveryType" "AnnouncementDeliveryType" NOT NULL,
  "status" "AnnouncementDeliveryStatus" NOT NULL,
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnouncementDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailPreferenceToken" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "testOnly" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailPreferenceToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnnouncementCampaign_status_createdAt_idx" ON "AnnouncementCampaign"("status", "createdAt");
CREATE INDEX "AnnouncementCampaign_createdByUserId_idx" ON "AnnouncementCampaign"("createdByUserId");
CREATE INDEX "AnnouncementDelivery_campaignId_deliveryType_idx" ON "AnnouncementDelivery"("campaignId", "deliveryType");
CREATE INDEX "AnnouncementDelivery_recipientUserId_idx" ON "AnnouncementDelivery"("recipientUserId");
CREATE UNIQUE INDEX "EmailPreferenceToken_tokenHash_key" ON "EmailPreferenceToken"("tokenHash");
CREATE INDEX "EmailPreferenceToken_userId_expiresAt_idx" ON "EmailPreferenceToken"("userId", "expiresAt");

ALTER TABLE "AnnouncementDelivery"
  ADD CONSTRAINT "AnnouncementDelivery_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "AnnouncementCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailPreferenceToken"
  ADD CONSTRAINT "EmailPreferenceToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
