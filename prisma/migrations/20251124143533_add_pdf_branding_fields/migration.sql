-- AlterTable
ALTER TABLE "customization_settings" ADD COLUMN     "pdfCompanyName" TEXT,
ADD COLUMN     "pdfCompanyTagline" TEXT,
ADD COLUMN     "pdfContactEmail" TEXT,
ADD COLUMN     "pdfContactPhone" TEXT,
ADD COLUMN     "pdfLogoUrl" TEXT,
ADD COLUMN     "pdfUseTextLogo" BOOLEAN;
