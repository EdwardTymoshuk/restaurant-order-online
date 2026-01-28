// src/server/reservations/mutations.ts
import { protectedProcedure, publicProcedure, router } from '@/server/trpc'
import { ReservationStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createReservationFromDraft } from '../helpers/reservation/createReservationFromDraft'
import { createReservationInput } from '../helpers/reservation/validators'

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
          eventDate: {
            gte: input.from,
            lte: input.to,
          },
          status: input.status,
        },
        orderBy: {
          eventDate: 'asc',
        },
        include: {
          offerSnapshot: {
            select: {
              total: true,
              packageCode: true,
            },
          },
          contact: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      })
    }),
  getReservationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservation = await ctx.prisma.reservation.findUnique({
        where: { id: input.id },
        include: {
          offerSnapshot: true,
          extras: true,
          contact: true,
        },
      })

      if (!reservation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reservation not found',
        })
      }

      return reservation
    }),
  reservationAvailability: publicProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.calendarAvailability.findMany({
        where: {
          date: {
            gte: input.from,
            lte: input.to,
          },
        },
        orderBy: {
          date: 'asc',
        },
      })
    }),
})
