-- CreateTable
CREATE TABLE "ReservationSummaryPdf" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationSummaryPdf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSummaryPdf_reservationId_key" ON "ReservationSummaryPdf"("reservationId");

-- AddForeignKey
ALTER TABLE "ReservationSummaryPdf" ADD CONSTRAINT "ReservationSummaryPdf_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
