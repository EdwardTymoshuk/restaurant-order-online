import { prisma } from '@/lib/prisma'
import { drinkMenuItemCategories, foodMenuItemCategories } from '@/config'
import { getMenuImportKey, ImportDocumentType, parseMenuDocumentForImport } from '@/server/services/menuDocumentImport'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const getImportScopeCategories = (type: ImportDocumentType) => {
  if (type === 'menu') return foodMenuItemCategories
  if (type === 'drinks') return drinkMenuItemCategories
  return []
}

const isPresent = <T,>(value: T | null): value is T => value !== null

const buildMenuImportPreview = async (type: ImportDocumentType) => {
  const parsedItems = parseMenuDocumentForImport(type)
  const parsedByKey = new Map(parsedItems.map((item) => [getMenuImportKey(item), item]))
  const scopeCategories = getImportScopeCategories(type)
  const existingItems = await prisma.menuItem.findMany({
    where: {
      isArchived: false,
      category: {
        in: scopeCategories,
      },
    },
    select: {
      id: true,
      category: true,
      name: true,
      price: true,
      description: true,
    },
  })

  const existingByKey = new Map(
    existingItems.map((item) => [getMenuImportKey(item), item])
  )

  const created = parsedItems
    .filter((item) => !existingByKey.has(getMenuImportKey(item)))
    .map((item) => ({
      category: item.category,
      name: item.name,
      price: item.price,
      description: item.description,
    }))

  const updated = parsedItems
    .map((item) => {
      const existing = existingByKey.get(getMenuImportKey(item))
      if (!existing) return null

      const currentDescription = existing.description ?? null
      const nextDescription = item.description ?? null
      const changed = existing.price !== item.price || currentDescription !== nextDescription
      if (!changed) return null

      return {
        id: existing.id,
        category: item.category,
        name: item.name,
        price: item.price,
        currentPrice: existing.price,
        description: item.description,
      }
    })
    .filter(isPresent)

  const unchanged = parsedItems
    .filter((item) => {
      const existing = existingByKey.get(getMenuImportKey(item))
      if (!existing) return false
      return existing.price === item.price && (existing.description ?? null) === (item.description ?? null)
    })
    .map((item) => ({
      category: item.category,
      name: item.name,
      price: item.price,
    }))

  const missing = existingItems
    .filter((item) => !parsedByKey.has(getMenuImportKey(item)))
    .map((item) => ({
      id: item.id,
      category: item.category,
      name: item.name,
      price: item.price,
    }))

  return {
    type,
    total: parsedItems.length,
    created,
    updated,
    unchanged,
    missing,
  }
}

export const menuRouter = router({
  getMenuItems: publicProcedure.query(async () => {
    const items = await prisma.menuItem.findMany({
      where: {
        isOrderable: true,
        isActive: true,
        isArchived: false,
      },
    })
    return items
  }),

  getBestsellers: publicProcedure.query(async () => {
    const topSold = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          status: {
            not: 'CANCELLED',
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 12,
    })

    const soldIds = topSold.map((item) => item.menuItemId)
    const soldQuantities = new Map(topSold.map((item) => [item.menuItemId, item._sum.quantity ?? 0]))

    const [soldItems, recommendedItems] = await Promise.all([
      soldIds.length > 0
        ? prisma.menuItem.findMany({
            where: {
              id: { in: soldIds },
              isOrderable: true,
              isActive: true,
              isArchived: false,
            },
          })
        : Promise.resolve([]),
      prisma.menuItem.findMany({
        where: {
          isOrderable: true,
          isActive: true,
          isRecommended: true,
          isArchived: false,
        },
      }),
    ])

    const merged = new Map<string, (typeof soldItems)[number]>()
    ;[...soldItems, ...recommendedItems].forEach((item) => {
      merged.set(item.id, item)
    })

    return Array.from(merged.values())
      .sort((a, b) => {
        const salesDiff = (soldQuantities.get(b.id) ?? 0) - (soldQuantities.get(a.id) ?? 0)
        if (salesDiff !== 0) return salesDiff
        if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1
        return a.name.localeCompare(b.name, 'pl')
      })
      .slice(0, 12)
  }),

  getAllMenuItems: publicProcedure.query(async () => {
    const items = await prisma.menuItem.findMany({
      where: {
        isArchived: false,
      },
    })
    return items
  }),

  getMenuItemById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { id } = input

      const item = await prisma.menuItem.findUnique({
        where: { id },
      })

      if (!item) {
        throw new Error(`Item with ID ${id} not found`)
      }

      return item
    }),

  createMenuItem: publicProcedure
    .input(
      z.object({
        name: z.string(),
        price: z.number(),
        description: z.string().optional(),
        category: z.string(),
        image: z.string().optional(),
        isActive: z.boolean().default(true),
        isOrderable: z.boolean().default(false),
        isRecommended: z.boolean().default(false),
        isOnMainPage: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const newItem = await prisma.menuItem.create({
        data: {
          name: input.name,
          price: input.price,
          description: input.description,
          category: input.category,
          image: input.image,
          isActive: input.isActive,
          isOrderable: input.isOrderable,
          isRecommended: input.isRecommended,
          isOnMainPage: input.isOnMainPage,
          isArchived: false,
        },
      })
      return newItem
    }),

  updateMenuItem: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        price: z.number().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        category: z.string().optional(),
        isRecommended: z.boolean().optional(),
        isActive: z.boolean().optional(),
        isOrderable: z.boolean().optional(),
        isOnMainPage: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input

      const item = await prisma.menuItem.findUnique({
        where: { id },
      })

      if (!item) {
        throw new Error('Item not found')
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data,
      })
      return updatedItem
    }),

  deleteMenuItem: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id } = input

      const deletedItem = await prisma.menuItem.update({
        where: { id },
        data: {
          isArchived: true,
          isActive: false,
          isOrderable: false,
          isRecommended: false,
          isOnMainPage: false,
        },
      })

      return deletedItem
    }),

  previewMenuDocumentImport: publicProcedure
    .input(
      z.object({
        type: z.enum(['menu', 'drinks', 'other']),
      }),
    )
    .mutation(async ({ input }) => {
      return buildMenuImportPreview(input.type)
    }),

  importMenuFromDocument: publicProcedure
    .input(
      z.object({
        type: z.enum(['menu', 'drinks', 'other']),
        archiveMissingIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const parsedItems = parseMenuDocumentForImport(input.type)
      const existingItems = await prisma.menuItem.findMany({
        where: {
          isArchived: false,
        },
        select: {
          id: true,
          category: true,
          name: true,
        },
      })

      const existingByKey = new Map(
        existingItems.map((item) => [getMenuImportKey(item), item])
      )

      let created = 0
      let updated = 0

      for (const item of parsedItems) {
        const key = getMenuImportKey(item)
        const existing = existingByKey.get(key)

        if (existing) {
          await prisma.menuItem.update({
            where: { id: existing.id },
            data: {
              price: item.price,
              description: item.description,
              isActive: true,
              isOrderable: true,
              isArchived: false,
            },
          })
          updated += 1
          continue
        }

        const createdItem = await prisma.menuItem.create({
          data: {
            category: item.category,
            name: item.name,
            price: item.price,
            description: item.description,
            image: null,
            isActive: true,
            isOrderable: true,
            isRecommended: false,
            isOnMainPage: false,
            isArchived: false,
          },
          select: {
            id: true,
            category: true,
            name: true,
          },
        })

        existingByKey.set(getMenuImportKey(createdItem), createdItem)
        created += 1
      }

      let archived = 0
      if (input.archiveMissingIds.length > 0) {
        const result = await prisma.menuItem.updateMany({
          where: {
            id: {
              in: input.archiveMissingIds,
            },
            isArchived: false,
          },
          data: {
            isArchived: true,
            isActive: false,
            isOrderable: false,
            isRecommended: false,
            isOnMainPage: false,
          },
        })
        archived = result.count
      }

      return {
        total: parsedItems.length,
        created,
        updated,
        archived,
      }
    }),
})
