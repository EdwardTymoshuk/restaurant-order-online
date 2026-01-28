// src/server/helpers/reservation/createReservationFromDraft.ts
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { createReservationInput } from './validators'

type Input = z.infer<typeof createReservationInput>

export const createReservationFromDraft = async (
  prisma: PrismaClient,
  input: Input
) => {
  const { draft, contact } = input

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.create({
      data: {
        status: 'SENT',
        eventDate: new Date(draft.eventDate),
        startTime: draft.startTime,
        adultsCount: draft.adultsCount,
        childrenCount: draft.childrenCount,
        eventType: draft.eventType,
      },
    })

    await tx.reservationOfferSnapshot.create({
      data: {
        reservationId: reservation.id,
        packageCode: draft.packageCode,
        servingType: draft.servingType,
        basePricePerAdult: Math.round(draft.subtotal / draft.adultsCount),
        durationHours: 5,
        subtotal: draft.subtotal,
        serviceFee: draft.serviceFee,
        total: draft.total,
      },
    })

    if (draft.extras.length > 0) {
      await tx.reservationExtra.createMany({
        data: draft.extras.map((extra) => ({
          reservationId: reservation.id,
          type: extra.type,
          label: extra.label,
          quantity: extra.quantity,
          unitPrice: extra.unitPrice,
          totalPrice: extra.totalPrice,
          metadata: extra.metadata,
        })),
      })
    }

    await tx.reservationContact.create({
      data: {
        reservationId: reservation.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        notes: contact.notes,
      },
    })

    return reservation
  })
}
