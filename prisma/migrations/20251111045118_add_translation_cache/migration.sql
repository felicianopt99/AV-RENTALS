-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Translation_sourceText_idx" ON "Translation"("sourceText");

-- CreateIndex
CREATE INDEX "Translation_targetLang_idx" ON "Translation"("targetLang");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_sourceText_targetLang_key" ON "Translation"("sourceText", "targetLang");
