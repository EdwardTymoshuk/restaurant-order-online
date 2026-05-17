-- Track whether a reservation came from the public form or was created manually in the admin panel.
CREATE TYPE "ReservationSource" AS ENUM ('ONLINE', 'MANUAL');

ALTER TABLE "Reservation"
  ADD COLUMN "source" "ReservationSource" NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "createdByName" TEXT;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Reservation_source_idx" ON "Reservation"("source");
CREATE INDEX "Reservation_createdById_idx" ON "Reservation"("createdById");
