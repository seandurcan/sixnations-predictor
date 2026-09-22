CREATE TABLE "PredictionConfirmationDelivery" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "tournamentId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PredictionConfirmationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PredictionConfirmationDelivery_userId_tournamentId_key"
  ON "PredictionConfirmationDelivery"("userId", "tournamentId");
CREATE INDEX "PredictionConfirmationDelivery_tournamentId_status_idx"
  ON "PredictionConfirmationDelivery"("tournamentId", "status");
CREATE INDEX "PredictionConfirmationDelivery_status_lastAttemptAt_idx"
  ON "PredictionConfirmationDelivery"("status", "lastAttemptAt");

ALTER TABLE "PredictionConfirmationDelivery"
  ADD CONSTRAINT "PredictionConfirmationDelivery_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PredictionConfirmationDelivery"
  ADD CONSTRAINT "PredictionConfirmationDelivery_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
