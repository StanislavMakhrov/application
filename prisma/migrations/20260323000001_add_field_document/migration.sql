CREATE TABLE "FieldDocument" (
    "id" SERIAL NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FieldDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FieldDocument_fieldKey_year_key" ON "FieldDocument"("fieldKey", "year");
