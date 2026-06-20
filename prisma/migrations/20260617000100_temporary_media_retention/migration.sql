-- Add temporary media lifecycle markers for source videos and rendered clips.
ALTER TABLE "Video"
ADD COLUMN "mediaExpiresAt" TIMESTAMP(3),
ADD COLUMN "mediaDeletedAt" TIMESTAMP(3);

ALTER TABLE "Clip"
ADD COLUMN "mediaExpiresAt" TIMESTAMP(3),
ADD COLUMN "mediaDeletedAt" TIMESTAMP(3);

CREATE INDEX "Video_mediaExpiresAt_mediaDeletedAt_idx" ON "Video"("mediaExpiresAt", "mediaDeletedAt");
CREATE INDEX "Clip_mediaExpiresAt_mediaDeletedAt_idx" ON "Clip"("mediaExpiresAt", "mediaDeletedAt");
