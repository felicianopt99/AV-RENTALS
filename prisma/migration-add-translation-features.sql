-- Migration to add advanced translation management features
-- Add new columns to the Translation table

ALTER TABLE "Translation" 
ADD COLUMN "status" TEXT DEFAULT 'approved',
ADD COLUMN "quality_score" INTEGER DEFAULT 100,
ADD COLUMN "reviewed_by" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP,
ADD COLUMN "context" TEXT,
ADD COLUMN "tags" TEXT[],
ADD COLUMN "category" TEXT DEFAULT 'general',
ADD COLUMN "usage_count" INTEGER DEFAULT 0,
ADD COLUMN "last_used" TIMESTAMP,
ADD COLUMN "is_auto_translated" BOOLEAN DEFAULT false,
ADD COLUMN "needs_review" BOOLEAN DEFAULT false,
ADD COLUMN "version" INTEGER DEFAULT 1;

-- Create indexes for performance
CREATE INDEX "Translation_status_idx" ON "Translation"("status");
CREATE INDEX "Translation_category_idx" ON "Translation"("category");
CREATE INDEX "Translation_quality_score_idx" ON "Translation"("quality_score");
CREATE INDEX "Translation_needs_review_idx" ON "Translation"("needs_review");
CREATE INDEX "Translation_usage_count_idx" ON "Translation"("usage_count");

-- Create Translation History table for version control
CREATE TABLE "TranslationHistory" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "old_translated_text" TEXT NOT NULL,
    "new_translated_text" TEXT NOT NULL,
    "changed_by" TEXT,
    "change_reason" TEXT,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationHistory_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "TranslationHistory" ADD CONSTRAINT "TranslationHistory_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for TranslationHistory
CREATE INDEX "TranslationHistory_translation_id_idx" ON "TranslationHistory"("translation_id");
CREATE INDEX "TranslationHistory_version_idx" ON "TranslationHistory"("version");
CREATE INDEX "TranslationHistory_created_at_idx" ON "TranslationHistory"("created_at");