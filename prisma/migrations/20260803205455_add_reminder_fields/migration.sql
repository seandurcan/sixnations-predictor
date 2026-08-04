-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastPredictionReminderAt" TIMESTAMP(3),
ADD COLUMN     "lastVerificationReminderAt" TIMESTAMP(3);
