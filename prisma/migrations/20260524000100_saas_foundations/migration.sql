CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
    "stripePriceId" TEXT,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "renderMinutesLimit" INTEGER NOT NULL DEFAULT 120,
    "renderSecondsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clipId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "queuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RenderJob_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "Clip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "Project" ADD COLUMN "userAccountId" TEXT;
ALTER TABLE "Video" ADD COLUMN "objectKey" TEXT;
ALTER TABLE "Video" ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "Clip" ADD COLUMN "objectKey" TEXT;
ALTER TABLE "Clip" ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'local';

CREATE UNIQUE INDEX "UserAccount_clerkUserId_key" ON "UserAccount"("clerkUserId");
CREATE UNIQUE INDEX "UserAccount_stripeCustomerId_key" ON "UserAccount"("stripeCustomerId");
CREATE UNIQUE INDEX "UserAccount_stripeSubscriptionId_key" ON "UserAccount"("stripeSubscriptionId");
CREATE UNIQUE INDEX "RenderJob_clipId_key" ON "RenderJob"("clipId");
CREATE INDEX "Project_userAccountId_updatedAt_idx" ON "Project"("userAccountId", "updatedAt");
