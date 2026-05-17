ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

WITH numbered_orders AS (
  SELECT
    id,
    'SPK-' ||
      to_char("createdAt", 'YYMMDD') ||
      '-' ||
      lpad(
        row_number() OVER (
          PARTITION BY date_trunc('day', "createdAt")
          ORDER BY "createdAt", id
        )::text,
        3,
        '0'
      ) AS generated_number
  FROM "Order"
)
UPDATE "Order"
SET "orderNumber" = numbered_orders.generated_number
FROM numbered_orders
WHERE "Order".id = numbered_orders.id;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
