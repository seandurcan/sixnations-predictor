ALTER TABLE "public"."User"
ADD COLUMN "tournamentPointsGuess" INTEGER;

ALTER TABLE "public"."LeaderboardSnapshot"
ADD COLUMN "correctMargins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "correctResults" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "public"."Prediction"
ADD COLUMN "correctMargin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "correctResult" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "public"."TournamentWinner_tournamentId_key";
ALTER TABLE "public"."TournamentWinner"
ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX "TournamentWinner_tournamentId_userId_key"
ON "public"."TournamentWinner"("tournamentId", "userId");
CREATE INDEX "TournamentWinner_tournamentId_rank_idx"
ON "public"."TournamentWinner"("tournamentId", "rank");
