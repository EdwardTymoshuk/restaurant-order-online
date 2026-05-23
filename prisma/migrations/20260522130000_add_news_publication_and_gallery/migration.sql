ALTER TABLE "News"
ADD COLUMN "slug" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "eventStartDate" TIMESTAMP(3),
ADD COLUMN "eventEndDate" TIMESTAMP(3),
ADD COLUMN "isEnded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "News"
SET "publishedAt" = "createdAt"
WHERE "publishedAt" IS NULL;

CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

CREATE TABLE "GalleryImage" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "alt" TEXT,
  "src" TEXT NOT NULL,
  "thumbnail" TEXT,
  "category" TEXT NOT NULL DEFAULT 'details',
  "width" INTEGER,
  "height" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GalleryImage_category_sortOrder_idx" ON "GalleryImage"("category", "sortOrder");

CREATE INDEX IF NOT EXISTS "Reservation_source_idx" ON "Reservation"("source");
CREATE INDEX IF NOT EXISTS "Reservation_createdById_idx" ON "Reservation"("createdById");
