ALTER TYPE "TournamentStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "TournamentStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "TournamentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

CREATE TYPE "CompetitionEntryStatus" AS ENUM ('INVITED', 'ENTERED', 'WITHDRAWN');

ALTER TABLE "Tournament"
  ALTER COLUMN "firstKickoff" DROP NOT NULL,
  ALTER COLUMN "predictionLockAt" DROP NOT NULL,
  ADD COLUMN "entryFee" DECIMAL(10,2) NOT NULL DEFAULT 20,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "entriesOpenAt" TIMESTAMP(3),
  ADD COLUMN "entriesCloseAt" TIMESTAMP(3);

CREATE TABLE "CompetitionEntry" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "tournamentId" INTEGER NOT NULL,
  "status" "CompetitionEntryStatus" NOT NULL DEFAULT 'INVITED',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "predictionsSubmitted" BOOLEAN NOT NULL DEFAULT false,
  "predictionSubmittedAt" TIMESTAMP(3),
  "tournamentPointsGuess" INTEGER,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "cumulativeError" INTEGER NOT NULL DEFAULT 0,
  "exactScores" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompetitionEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompetitionEntry_userId_tournamentId_key"
  ON "CompetitionEntry"("userId", "tournamentId");
CREATE INDEX "CompetitionEntry_tournamentId_status_idx"
  ON "CompetitionEntry"("tournamentId", "status");
CREATE INDEX "CompetitionEntry_tournamentId_paymentStatus_idx"
  ON "CompetitionEntry"("tournamentId", "paymentStatus");

ALTER TABLE "CompetitionEntry"
  ADD CONSTRAINT "CompetitionEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionEntry"
  ADD CONSTRAINT "CompetitionEntry_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CompetitionEntry" (
  "userId", "tournamentId", "status", "paymentStatus", "paidAt",
  "predictionsSubmitted", "predictionSubmittedAt", "tournamentPointsGuess",
  "totalPoints", "cumulativeError", "exactScores", "updatedAt"
)
SELECT
  u."id", t."id", 'ENTERED'::"CompetitionEntryStatus", u."paymentStatus", u."paidAt",
  u."predictionsSubmitted", u."predictionSubmittedAt", u."tournamentPointsGuess",
  u."totalPoints", u."cumulativeError", u."exactScores", CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN LATERAL (
  SELECT "id" FROM "Tournament" ORDER BY "firstKickoff" ASC NULLS LAST, "id" ASC LIMIT 1
) t
WHERE u."deletedAt" IS NULL
ON CONFLICT ("userId", "tournamentId") DO NOTHING;
