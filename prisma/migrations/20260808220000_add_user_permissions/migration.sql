ALTER TABLE "User" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]';

UPDATE "User"
SET "permissions" = CASE
  WHEN "role" = 'manager' THEN '["dashboard.view","orders.view","orders.manage","reservations.view","reservations.manage","menu.view","menu.manage","settings.view"]'::jsonb
  WHEN "role" = 'user' THEN '["dashboard.view","orders.view","orders.manage","reservations.view"]'::jsonb
  ELSE '[]'::jsonb
END
WHERE "permissions" = '[]'::jsonb;
