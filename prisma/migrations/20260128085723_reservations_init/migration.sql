-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'COMMUNION', 'CHRISTENING', 'COMPANY_EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PackageCode" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ReservationExtraType" AS ENUM ('EXTENDED_TIME', 'COLD_PLATE', 'PREMIUM_PLATTER', 'KIDS_MENU', 'DESSERTS', 'CAKE', 'SPECIAL_DIET');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'SENT',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "adultsCount" INTEGER NOT NULL,
    "childrenCount" INTEGER,
    "eventType" "EventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationOfferSnapshot" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "packageCode" "PackageCode" NOT NULL,
    "servingType" TEXT NOT NULL,
    "basePricePerAdult" INTEGER NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "serviceFee" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationOfferSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationExtra" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "ReservationExtraType" NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ReservationExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationContact" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarAvailability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "basePriceFrom" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationOfferSnapshot_reservationId_key" ON "ReservationOfferSnapshot"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationContact_reservationId_key" ON "ReservationContact"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarAvailability_date_key" ON "CalendarAvailability"("date");

-- AddForeignKey
ALTER TABLE "ReservationOfferSnapshot" ADD CONSTRAINT "ReservationOfferSnapshot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationExtra" ADD CONSTRAINT "ReservationExtra_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationContact" ADD CONSTRAINT "ReservationContact_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
