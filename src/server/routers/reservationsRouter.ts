import { permissionProcedure, protectedProcedure, publicProcedure, router } from '@/server/trpc'
import { prisma as prismaClient } from '@/lib/prisma'
import { notifyNewReservation } from '@/lib/pushNotifications'
import { EventType, PackageCode, ReservationExtraType, ReservationStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createReservationFromDraft } from '../helpers/reservation/createReservationFromDraft'
import { createReservationInput } from '../helpers/reservation/validators'

const extraItemInput = z.object({
  type: z.nativeEnum(ReservationExtraType),
  label: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
})

const reservationUpsertInput = z.object({
  eventDate: z.string(), // ISO date string
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  adultsCount: z.number().int().min(1),
  childrenCount: z.number().int().min(0).optional(),
  eventType: z.nativeEnum(EventType).optional().default('OTHER'),
  status: z.nativeEnum(ReservationStatus).optional().default('CONFIRMED'),
  contact: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
    notes: z.string().nullable().optional(),
  }),
  packageCode: z.nativeEnum(PackageCode).nullable().optional(),
  total: z.number().nullable().optional(),
  extras: z.array(extraItemInput).optional(),
})

const parseTimeMinutes = (value: string | null | undefined) => {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const hasOverlap = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start < b.end && b.start < a.end

const validateReservationCapacity = async (input: {
  date: string
  startTime?: string | null
  endTime?: string | null
  guests: number
  adultGuests: number
  excludeId?: string
}) => {
  const settings = await prismaClient.settings.findFirst({ select: { reservationCapacity: true, reservationMinGuests: true } })
  const capacity = Math.max(1, settings?.reservationCapacity ?? 40)
  const minGuests = Math.max(1, settings?.reservationMinGuests ?? 12)
  if (input.guests > capacity) throw new TRPCError({ code: 'BAD_REQUEST', message: `Rezerwacja przekracza pojemność ${capacity} osób.` })
  if (input.adultGuests < minGuests) throw new TRPCError({ code: 'BAD_REQUEST', message: `Minimalna liczba dorosłych to ${minGuests}.` })

  const dateStart = new Date(`${input.date}T00:00:00.000Z`)
  const dateEnd = new Date(`${input.date}T23:59:59.999Z`)
  const [blocked, reservations] = await Promise.all([
    prismaClient.calendarAvailability.findFirst({ where: { date: { gte: dateStart, lte: dateEnd }, isBlocked: true }, select: { notes: true } }),
    prismaClient.reservation.findMany({
      where: { eventDate: { gte: dateStart, lte: dateEnd }, status: { in: ['SENT', 'CONFIRMED'] }, ...(input.excludeId ? { id: { not: input.excludeId } } : {}) },
      select: { startTime: true, endTime: true, adultsCount: true, childrenCount: true, extras: { select: { label: true } } },
    }),
  ])
  if (blocked) throw new TRPCError({ code: 'BAD_REQUEST', message: blocked.notes || 'Wybrany dzień jest zablokowany.' })

  const requested = { start: parseTimeMinutes(input.startTime) ?? 600, end: parseTimeMinutes(input.endTime) ?? 1380 }
  for (let slotStart = 600; slotStart < 1380; slotStart += 30) {
    const slot = { start: slotStart, end: slotStart + 30 }
    if (!hasOverlap(slot, requested)) continue
    const occupied = reservations.reduce((total, reservation) => {
      if (reservation.extras.some((extra) => extra.label === 'Wyłączność sali')) return capacity
      const range = { start: parseTimeMinutes(reservation.startTime) ?? 600, end: parseTimeMinutes(reservation.endTime) ?? 1380 }
      return total + (hasOverlap(slot, range) ? reservation.adultsCount + (reservation.childrenCount ?? 0) : 0)
    }, 0)
    if (occupied + input.guests > capacity) throw new TRPCError({ code: 'CONFLICT', message: `W wybranych godzinach pozostało miejsce dla maksymalnie ${Math.max(0, capacity - occupied)} osób.` })
  }
}

export const reservationsRouter = router({
  createFromDraft: publicProcedure
    .input(createReservationInput)
    .mutation(async ({ ctx, input }) => {
      const reservation = await createReservationFromDraft(ctx.prisma, input)

      await notifyNewReservation({
        id: reservation.id,
        name: input.contact.name,
        eventDate: reservation.eventDate,
        startTime: reservation.startTime,
        guests: input.draft.adultsCount + (input.draft.childrenCount ?? 0),
      }).catch((error) => {
        console.error('Failed to send new reservation push notification.', error)
      })

      return reservation
    }),

  getReservationsList: permissionProcedure('reservations.view')
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        status: z.nativeEnum(ReservationStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.reservation.findMany({
        where: {
          eventDate: { gte: input.from, lte: input.to },
          status: input.status,
        },
        orderBy: { eventDate: 'asc' },
        include: {
          offerSnapshot: { select: { total: true, packageCode: true } },
          contact: { select: { name: true, phone: true } },
          createdBy: { select: { username: true, name: true, email: true } },
        },
      })
    }),

  getReservationById: permissionProcedure('reservations.view')
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservation = await ctx.prisma.reservation.findUnique({
        where: { id: input.id },
        include: {
          offerSnapshot: true,
          extras: true,
          contact: true,
          summaryPdf: { select: { filename: true, createdAt: true } },
          createdBy: { select: { username: true, name: true, email: true } },
        },
      })
      if (!reservation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' })
      return reservation
    }),

  createReservation: permissionProcedure('reservations.manage')
    .input(reservationUpsertInput)
    .mutation(async ({ ctx, input }) => {
      await validateReservationCapacity({
        date: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        guests: input.adultsCount + (input.childrenCount ?? 0),
        adultGuests: input.adultsCount,
      })
      const creator = ctx.user?.id
        ? await ctx.prisma.user.findUnique({
            where: { id: ctx.user.id },
            select: { id: true, username: true, name: true, email: true },
          })
        : null
      const reservation = await ctx.prisma.reservation.create({
        data: {
          source: 'MANUAL',
          createdById: creator?.id ?? null,
          createdByName: creator?.name ?? creator?.username ?? creator?.email ?? null,
          eventDate: new Date(input.eventDate),
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          adultsCount: input.adultsCount,
          childrenCount: input.childrenCount ?? 0,
          eventType: input.eventType ?? 'OTHER',
          status: input.status ?? 'CONFIRMED',
          contact: { create: input.contact },
          ...(input.packageCode && input.total != null
            ? {
                offerSnapshot: {
                  create: {
                    packageCode: input.packageCode,
                    servingType: 'standard',
                    basePricePerAdult: 0,
                    durationHours: 5,
                    subtotal: input.total,
                    serviceFee: 0,
                    total: input.total,
                  },
                },
              }
            : {}),
          ...(input.extras && input.extras.length > 0
            ? {
                extras: {
                  create: input.extras.map((e) => ({
                    type: e.type,
                    label: e.label,
                    quantity: e.quantity,
                    unitPrice: e.unitPrice,
                    totalPrice: e.quantity * e.unitPrice,
                  })),
                },
              }
            : {}),
        },
        include: {
          offerSnapshot: { select: { total: true, packageCode: true } },
          contact: { select: { name: true, phone: true } },
          createdBy: { select: { username: true, name: true, email: true } },
        },
      })

      await notifyNewReservation({
        id: reservation.id,
        name: reservation.contact?.name ?? input.contact.name,
        eventDate: reservation.eventDate,
        startTime: reservation.startTime,
        guests: reservation.adultsCount + (reservation.childrenCount ?? 0),
      }).catch((error) => {
        console.error('Failed to send new reservation push notification.', error)
      })

      return reservation
    }),

  updateReservation: permissionProcedure('reservations.manage')
    .input(reservationUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, contact, packageCode, total, ...rest } = input

      await validateReservationCapacity({
        date: rest.eventDate,
        startTime: rest.startTime,
        endTime: rest.endTime,
        guests: rest.adultsCount + (rest.childrenCount ?? 0),
        adultGuests: rest.adultsCount,
        excludeId: id,
      })

      await ctx.prisma.reservationContact.upsert({
        where: { reservationId: id },
        create: { ...contact, reservationId: id },
        update: contact,
      })

      return ctx.prisma.reservation.update({
        where: { id },
        data: {
          eventDate: new Date(rest.eventDate),
          startTime: rest.startTime ?? null,
          endTime: rest.endTime ?? null,
          adultsCount: rest.adultsCount,
          childrenCount: rest.childrenCount ?? 0,
          eventType: rest.eventType ?? 'OTHER',
          status: rest.status ?? 'CONFIRMED',
        },
        include: {
          offerSnapshot: { select: { total: true, packageCode: true } },
          contact: { select: { name: true, phone: true } },
          createdBy: { select: { username: true, name: true, email: true } },
        },
      })
    }),

  deleteReservation: permissionProcedure('reservations.manage')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.reservation.delete({ where: { id: input.id } })
      return { success: true }
    }),

  updateStatus: permissionProcedure('reservations.manage')
    .input(z.object({ id: z.string(), status: z.nativeEnum(ReservationStatus) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reservation.update({
        where: { id: input.id },
        data: { status: input.status, updatedAt: new Date() },
      })
    }),

  // ── Blocked dates ─────────────────────────────────────────────────────────

  getBlockedDates: permissionProcedure('reservations.view')
    .query(async ({ ctx }) => {
      return ctx.prisma.calendarAvailability.findMany({
        orderBy: { date: 'asc' },
      })
    }),

  upsertBlockedDate: permissionProcedure('reservations.manage')
    .input(z.object({
      date: z.string(), // YYYY-MM-DD
      isBlocked: z.boolean(),
      notes: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date)
      return ctx.prisma.calendarAvailability.upsert({
        where: { date },
        create: { date, isBlocked: input.isBlocked, notes: input.notes ?? null },
        update: { isBlocked: input.isBlocked, notes: input.notes ?? null },
      })
    }),

  upsertBlockedDateRange: permissionProcedure('reservations.manage')
    .input(z.object({
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notes: z.string().trim().max(200).nullable().optional(),
    }).refine((input) => input.dateFrom <= input.dateTo, {
      message: 'Data końcowa musi być późniejsza lub równa dacie początkowej.',
      path: ['dateTo'],
    }).refine((input) => {
      const from = new Date(`${input.dateFrom}T00:00:00.000Z`).getTime()
      const to = new Date(`${input.dateTo}T00:00:00.000Z`).getTime()
      return Number.isFinite(from) && Number.isFinite(to) && (to - from) / 86400000 <= 366
    }, {
      message: 'Jednym wpisem można zablokować maksymalnie 367 dni.',
      path: ['dateTo'],
    }))
    .mutation(async ({ ctx, input }) => {
      const notes = input.notes ?? 'Zakres zablokowany'
      const from = new Date(`${input.dateFrom}T00:00:00.000Z`)
      const to = new Date(`${input.dateTo}T00:00:00.000Z`)
      const dates: Date[] = []

      for (const cursor = new Date(from); cursor <= to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        dates.push(new Date(cursor))
      }

      await ctx.prisma.$transaction(
        dates.map((date) => ctx.prisma.calendarAvailability.upsert({
          where: { date },
          create: { date, isBlocked: true, notes },
          update: { isBlocked: true, notes },
        }))
      )

      return { success: true, count: dates.length }
    }),

  deleteBlockedDate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.calendarAvailability.delete({ where: { id: input.id } })
      return { success: true }
    }),

  reservationAvailability: publicProcedure
    .input(z.object({ from: z.date(), to: z.date() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.calendarAvailability.findMany({
        where: { date: { gte: input.from, lte: input.to } },
        orderBy: { date: 'asc' },
      })
    }),
})
