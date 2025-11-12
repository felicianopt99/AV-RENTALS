-- AlterTable
ALTER TABLE "Translation" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "context" TEXT,
ADD COLUMN     "isAutoTranslated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastUsed" TIMESTAMP(3),
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualityScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TranslationHistory" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "oldTranslatedText" TEXT NOT NULL,
    "newTranslatedText" TEXT NOT NULL,
    "changedBy" TEXT,
    "changeReason" TEXT,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslationHistory_translationId_idx" ON "TranslationHistory"("translationId");

-- CreateIndex
CREATE INDEX "TranslationHistory_version_idx" ON "TranslationHistory"("version");

-- CreateIndex
CREATE INDEX "TranslationHistory_createdAt_idx" ON "TranslationHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Translation_status_idx" ON "Translation"("status");

-- CreateIndex
CREATE INDEX "Translation_category_idx" ON "Translation"("category");

-- CreateIndex
CREATE INDEX "Translation_qualityScore_idx" ON "Translation"("qualityScore");

-- CreateIndex
CREATE INDEX "Translation_needsReview_idx" ON "Translation"("needsReview");

-- CreateIndex
CREATE INDEX "Translation_usageCount_idx" ON "Translation"("usageCount");

-- AddForeignKey
ALTER TABLE "TranslationHistory" ADD CONSTRAINT "TranslationHistory_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
