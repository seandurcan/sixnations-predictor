/*
  Warnings:

  - You are about to drop the column `stadium` on the `Team` table. All the data in the column will be lost.
  - Added the required column `matchNumber` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Match_awayTeamId_idx";

-- DropIndex
DROP INDEX "public"."Match_homeTeamId_idx";

-- AlterTable
ALTER TABLE "public"."Match" ADD COLUMN     "attendance" INTEGER,
ADD COLUMN     "awayTries" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "homeTries" INTEGER,
ADD COLUMN     "matchNumber" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "referee" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "stadiumCapacity" INTEGER,
ADD COLUMN     "weather" TEXT;

-- AlterTable
ALTER TABLE "public"."Team" DROP COLUMN "stadium",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "homeVenue" TEXT,
ADD COLUMN     "worldRanking" INTEGER;

-- CreateIndex
CREATE INDEX "Match_kickoffTime_idx" ON "public"."Match"("kickoffTime");
