-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'TEST');

-- CreateEnum
CREATE TYPE "public"."ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "themePreference" "public"."ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "cumulativeError" INTEGER NOT NULL DEFAULT 0,
    "exactScores" INTEGER NOT NULL DEFAULT 0,
    "registrationOrder" INTEGER NOT NULL,
    "predictionsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "predictionSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "flagSvg" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT,
    "stadium" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tournament" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."TournamentStatus" NOT NULL,
    "firstKickoff" TIMESTAMP(3) NOT NULL,
    "predictionLockAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "venue" TEXT NOT NULL,
    "kickoffTime" TIMESTAMP(3) NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "actualHomeScore" INTEGER,
    "actualAwayScore" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Prediction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "errorValue" INTEGER NOT NULL DEFAULT 0,
    "exactScore" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "public"."PaymentStatus" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordReset" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PredictionSubmission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "receiptReference" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PredictionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaderboardSnapshot" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "snapshotNumber" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "rankMovement" INTEGER,
    "totalPoints" INTEGER NOT NULL,
    "cumulativeError" INTEGER NOT NULL,
    "exactScores" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoreAudit" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "previousHome" INTEGER,
    "previousAway" INTEGER,
    "newHome" INTEGER NOT NULL,
    "newAway" INTEGER NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentWinner" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "finalPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentWinner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_paymentStatus_idx" ON "public"."User"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "public"."Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_shortCode_key" ON "public"."Team"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_year_key" ON "public"."Tournament"("year");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "public"."Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_homeTeamId_idx" ON "public"."Match"("homeTeamId");

-- CreateIndex
CREATE INDEX "Match_awayTeamId_idx" ON "public"."Match"("awayTeamId");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "public"."Prediction"("userId");

-- CreateIndex
CREATE INDEX "Prediction_matchId_idx" ON "public"."Prediction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_matchId_key" ON "public"."Prediction"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "public"."Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "public"."PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionSubmission_receiptReference_key" ON "public"."PredictionSubmission"("receiptReference");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardSnapshot_tournamentId_snapshotNumber_userId_key" ON "public"."LeaderboardSnapshot"("tournamentId", "snapshotNumber", "userId");

-- CreateIndex
CREATE INDEX "ScoreAudit_matchId_idx" ON "public"."ScoreAudit"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentWinner_tournamentId_key" ON "public"."TournamentWinner"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "public"."SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PredictionSubmission" ADD CONSTRAINT "PredictionSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PredictionSubmission" ADD CONSTRAINT "PredictionSubmission_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
