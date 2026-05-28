ALTER TABLE "UserAccount"
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "onboardingAnswers" JSONB;
