ALTER TABLE "Settings" ADD COLUMN "restaurantInfo" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Settings" ADD COLUMN "openingHours" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Settings" ADD COLUMN "openingHourOverrides" JSONB NOT NULL DEFAULT '[]';
