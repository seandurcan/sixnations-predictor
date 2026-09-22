CREATE TABLE "AdminUserActionAudit" (
  "id" SERIAL NOT NULL,
  "adminUserId" INTEGER NOT NULL,
  "targetUserId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "targetEmailHash" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminUserActionAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminUserActionAudit_targetUserId_createdAt_idx"
  ON "AdminUserActionAudit"("targetUserId", "createdAt");

CREATE INDEX "AdminUserActionAudit_adminUserId_createdAt_idx"
  ON "AdminUserActionAudit"("adminUserId", "createdAt");
