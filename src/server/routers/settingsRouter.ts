import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const getActorName = async (userId?: string | null) => {
  if (!userId) return 'Administrator'

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      email: true,
    },
  })

  return user?.name || user?.username || user?.email || 'Administrator'
}

const restaurantInfoInput = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40),
  email: z.string().trim().email().or(z.literal('')),
  address: z.string().trim().max(200),
})

const openingHoursInput = z.array(z.object({
  day: z.number().int().min(1).max(7),
  isClosed: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}))

const openingHourOverridesInput = z.array(z.object({
  id: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['hours', 'closed']),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  title: z.string().trim().max(120),
  message: z.string().trim().max(300),
})).superRefine((items, ctx) => {
  items.forEach((item, index) => {
    if (item.startDate > item.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'endDate'], message: 'Data końcowa nie może być wcześniejsza.' })
    }
    if (item.type === 'hours' && (!item.start || !item.end)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'start'], message: 'Podaj godziny wyjątku.' })
    }
  })
})

export const settingsRouter = router({
  // Get all settings
  getSettings: publicProcedure.query(async () => {
    const settings = await prisma.settings.findFirst()

    if (!settings) {
      throw new Error('Settings not found')
    }

    return settings
  }),

  updateRestaurantInfo: publicProcedure
    .input(z.object({
      restaurantInfo: restaurantInfoInput,
      openingHours: openingHoursInput,
      openingHourOverrides: openingHourOverridesInput,
    }))
    .mutation(async ({ input }) => {
      const settings = await prisma.settings.findFirst()
      if (!settings) throw new Error('Settings not found')

      return prisma.settings.update({
        where: { id: settings.id },
        data: {
          restaurantInfo: input.restaurantInfo,
          openingHours: input.openingHours,
          openingHourOverrides: input.openingHourOverrides,
        },
      })
    }),

  // Update ordering state
  updateOrderingState: publicProcedure
    .input(
      z.object({
        isOrderingOpen: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const settings = await prisma.settings.findFirst()

      if (!settings) {
        throw new Error('Settings not found')
      }

      return await prisma.settings.update({
        where: { id: settings.id },
        data: { isOrderingOpen: input.isOrderingOpen },
      })
    }),

  // Update order wait time
  updateOrderWaitTime: publicProcedure
    .input(
      z.object({
        orderWaitTime: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const settings = await prisma.settings.findFirst()

      if (!settings) {
        throw new Error('Settings not found')
      }

      return await prisma.settings.update({
        where: { id: settings.id },
        data: { orderWaitTime: input.orderWaitTime },
      })
    }),

  // Update delivery cost
  updateDeliveryCost: publicProcedure
    .input(
      z.object({
        deliveryCost: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const settings = await prisma.settings.findFirst()

      if (!settings) {
        throw new Error('Settings not found')
      }

      return await prisma.settings.update({
        where: { id: settings.id },
        data: { deliveryCost: input.deliveryCost },
      })
    }),

  // Update delivery zone prices
  updateDeliveryZonePrices: publicProcedure
    .input(
      z.array(
        z.object({
          minRadius: z.number(), // Мінімальна відстань
          maxRadius: z.number(), // Максимальна відстань
          price: z.number(), // Ціна доставки
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const settings = await prisma.settings.findFirst()

      if (!settings) {
        throw new Error('Settings not found')
      }

      // Validate the input to ensure ranges don't overlap
      for (let i = 0; i < input.length; i++) {
        for (let j = i + 1; j < input.length; j++) {
          const a = input[i]
          const b = input[j]
          if (
            (a.minRadius < b.maxRadius && a.maxRadius > b.minRadius) || // Перекриття
            (b.minRadius < a.maxRadius && b.maxRadius > a.minRadius) // Перекриття
          ) {
            throw new Error(
              `Overlapping delivery zones detected between zones ${i + 1} and ${j + 1}`,
            )
          }
        }
      }

      // Save the delivery zones in settings
      return await prisma.settings.update({
        where: { id: settings.id },
        data: { deliveryZones: input }, // Зберігаємо як масив зон
      })
    }),
  updateMenuDocuments: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          title: z.string().min(1),
          url: z.string().min(1).refine(
            (value) => {
              if (value.startsWith('/')) return true
              try {
                new URL(value)
                return true
              } catch {
                return false
              }
            },
            { message: 'Invalid url' }
          ),
          type: z.enum(['menu', 'drinks', 'full', 'other']),
          sortOrder: z.number().int().min(0),
          isActive: z.boolean(),
          uploadedAt: z.string().optional(),
          uploadedBy: z.string().optional(),
          importedAt: z.string().optional(),
          importedBy: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const settings = await prisma.settings.findFirst()
      if (!settings) throw new Error('Settings not found')

      const existingDocuments = Array.isArray(settings.menuDocuments)
        ? (settings.menuDocuments as Array<{
            id?: string
            uploadedAt?: string
            uploadedBy?: string
            importedAt?: string
            importedBy?: string
          }>)
        : []
      const existingById = new Map(existingDocuments.map((doc) => [doc.id, doc]))
      const now = new Date().toISOString()
      const actorName = await getActorName(ctx.user?.id)
      const documentsWithMetadata = input.map((doc) => {
        const existing = existingById.get(doc.id)
        const isNewUpload = Boolean(doc.uploadedAt && doc.uploadedAt !== existing?.uploadedAt)

        return {
          ...doc,
          uploadedAt: doc.uploadedAt || existing?.uploadedAt || now,
          uploadedBy: isNewUpload ? actorName : doc.uploadedBy || existing?.uploadedBy || actorName,
          importedAt: isNewUpload ? doc.importedAt : doc.importedAt || existing?.importedAt,
          importedBy: isNewUpload ? doc.importedBy : doc.importedBy || existing?.importedBy,
        }
      })

      return await prisma.settings.update({
        where: { id: settings.id },
        data: { menuDocuments: documentsWithMetadata as unknown as Prisma.InputJsonValue },
      })
    }),
  updatePizzaAvailability: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(), // Увімкнення/вимкнення категорії
        availability: z.array(
          z.object({
            day: z.number().min(0).max(6), // Дні (0 - неділя, 6 - субота)
            startHour: z.number().min(0).max(23), // Початкова година
            endHour: z.number().min(0).max(23), // Кінцева година
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const settings = await prisma.settings.findFirst()
      if (!settings) throw new Error('Settings not found')

      return await prisma.settings.update({
        where: { id: settings.id },
        data: {
          pizzaCategoryEnabled: input.enabled,
          pizzaAvailability: input.availability,
        },
      })
    }),
})
