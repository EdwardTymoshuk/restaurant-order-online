// src/server/helpers/reservation/validators.ts
import { EventType, PackageCode, ReservationExtraType } from '@prisma/client'
import { z } from 'zod'

export const reservationDraftInput = z.object({
  eventDate: z.string(),
  startTime: z.string().optional(),

  adultsCount: z.number().min(1),
  childrenCount: z.number().optional(),

  eventType: z.nativeEnum(EventType),

  packageCode: z.nativeEnum(PackageCode),
  servingType: z.string(),

  subtotal: z.number().min(0),
  serviceFee: z.number().min(0),
  total: z.number().min(0),

  extras: z.array(
    z.object({
      type: z.nativeEnum(ReservationExtraType),
      label: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      totalPrice: z.number().min(0),
      metadata: z.any().optional(),
    })
  ),
})

export const reservationContactInput = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
  notes: z.string().optional(),
})

export const createReservationInput = z.object({
  draft: reservationDraftInput,
  contact: reservationContactInput,
})
