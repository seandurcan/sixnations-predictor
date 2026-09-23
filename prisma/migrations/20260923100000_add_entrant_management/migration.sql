ALTER TABLE "CompetitionEntry"
  ADD COLUMN "withdrawnFromStatus" "CompetitionEntryStatus";

ALTER TABLE "AdminUserActionAudit"
  ALTER COLUMN "targetUserId" DROP NOT NULL,
  ADD COLUMN "targetReference" TEXT;

CREATE TABLE "CompetitionInvitation" (
  "id" SERIAL NOT NULL,
  "tournamentId" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "mobile" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "invitedById" INTEGER NOT NULL,
  "acceptedUserId" INTEGER,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompetitionInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompetitionInvitation_tokenHash_key"
  ON "CompetitionInvitation"("tokenHash");
CREATE UNIQUE INDEX "CompetitionInvitation_tournamentId_email_key"
  ON "CompetitionInvitation"("tournamentId", "email");
CREATE INDEX "CompetitionInvitation_tournamentId_status_idx"
  ON "CompetitionInvitation"("tournamentId", "status");
CREATE INDEX "CompetitionInvitation_email_status_idx"
  ON "CompetitionInvitation"("email", "status");

ALTER TABLE "CompetitionInvitation"
  ADD CONSTRAINT "CompetitionInvitation_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
