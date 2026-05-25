CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAccountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ayrshare',
    "providerProfileId" TEXT,
    "providerProfileKey" TEXT,
    "connectedPlatforms" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialConnection_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAccountId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ayrshare',
    "providerPostId" TEXT,
    "selectedPlatforms" TEXT NOT NULL,
    "sharedCaption" TEXT NOT NULL,
    "platformOverrides" TEXT NOT NULL DEFAULT '{}',
    "scheduledAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULING',
    "providerResponse" TEXT NOT NULL DEFAULT '{}',
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledPost_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPost_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "Clip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SocialConnection_userAccountId_provider_key" ON "SocialConnection"("userAccountId", "provider");
CREATE INDEX "SocialConnection_providerProfileId_idx" ON "SocialConnection"("providerProfileId");
CREATE INDEX "ScheduledPost_userAccountId_scheduledAt_idx" ON "ScheduledPost"("userAccountId", "scheduledAt");
CREATE INDEX "ScheduledPost_clipId_scheduledAt_idx" ON "ScheduledPost"("clipId", "scheduledAt");
CREATE INDEX "ScheduledPost_providerPostId_idx" ON "ScheduledPost"("providerPostId");
