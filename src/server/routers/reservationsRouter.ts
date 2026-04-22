import { protectedProcedure, publicProcedure, router } from '@/server/trpc'
import { EventType, PackageCode, ReservationStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createReservationFromDraft } from '../helpers/reservation/createReservationFromDraft'
import { createReservationInput } from '../helpers/reservation/validators'

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
})

export const reservationsRouter = router({
  createFromDraft: publicProcedure
    .input(createReservationInput)
    .mutation(async ({ ctx, input }) => {
      return createReservationFromDraft(ctx.prisma, input)
    }),

  getReservationsList: protectedProcedure
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
        },
      })
    }),

  getReservationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservation = await ctx.prisma.reservation.findUnique({
        where: { id: input.id },
        include: { offerSnapshot: true, extras: true, contact: true },
      })
      if (!reservation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' })
      return reservation
    }),

  createReservation: protectedProcedure
    .input(reservationUpsertInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reservation.create({
        data: {
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
        },
        include: {
          offerSnapshot: { select: { total: true, packageCode: true } },
          contact: { select: { name: true, phone: true } },
        },
      })
    }),

  updateReservation: protectedProcedure
    .input(reservationUpsertInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, contact, packageCode, total, ...rest } = input

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
        },
      })
    }),

  deleteReservation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.reservation.delete({ where: { id: input.id } })
      return { success: true }
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(ReservationStatus) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.reservation.update({
        where: { id: input.id },
        data: { status: input.status, updatedAt: new Date() },
      })
    }),

  // ── Blocked dates ─────────────────────────────────────────────────────────

  getBlockedDates: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.calendarAvailability.findMany({
        orderBy: { date: 'asc' },
      })
    }),

  upsertBlockedDate: protectedProcedure
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
