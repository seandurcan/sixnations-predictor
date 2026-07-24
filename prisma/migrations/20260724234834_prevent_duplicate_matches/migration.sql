/*
  Warnings:

  - A unique constraint covering the columns `[tournamentId,matchNumber]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Match_tournamentId_matchNumber_key" ON "public"."Match"("tournamentId", "matchNumber");
