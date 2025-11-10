/*
  Warnings:

  - Added the required column `type` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "equipmentId" TEXT,
    "equipmentName" TEXT,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "feeId" TEXT,
    "feeName" TEXT,
    "amount" REAL,
    "feeType" TEXT,
    "quantity" INTEGER,
    "unitPrice" REAL,
    "days" INTEGER,
    "lineTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "EquipmentItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuoteItem" ("createdAt", "days", "equipmentId", "equipmentName", "id", "lineTotal", "quantity", "quoteId", "unitPrice", "updatedAt") SELECT "createdAt", "days", "equipmentId", "equipmentName", "id", "lineTotal", "quantity", "quoteId", "unitPrice", "updatedAt" FROM "QuoteItem";
DROP TABLE "QuoteItem";
ALTER TABLE "new_QuoteItem" RENAME TO "QuoteItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
