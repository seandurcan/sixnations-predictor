CREATE TABLE "DuplicateAccountReview" (
  "id" SERIAL NOT NULL,
  "lowerUserId" INTEGER NOT NULL,
  "higherUserId" INTEGER NOT NULL,
  "decision" TEXT NOT NULL,
  "reviewedById" INTEGER NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DuplicateAccountReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DuplicateAccountReview_lowerUserId_higherUserId_key"
  ON "DuplicateAccountReview"("lowerUserId", "higherUserId");

CREATE INDEX "DuplicateAccountReview_decision_reviewedAt_idx"
  ON "DuplicateAccountReview"("decision", "reviewedAt");

CREATE INDEX "DuplicateAccountReview_reviewedById_idx"
  ON "DuplicateAccountReview"("reviewedById");
