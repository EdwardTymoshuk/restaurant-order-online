import { prisma } from '@/lib/prisma'
import { drinkMenuItemCategories, foodMenuItemCategories, isAlcoholMenuCategory } from '@/config'
import {
  getMenuImportKey,
  ImportDocumentType,
  parseMenuDocumentForImport,
  parseMenuDocumentWithOcr,
  ParsedMenuImportItem,
} from '@/server/services/menuDocumentImport'
import type { MenuDownloadDocument } from '@/app/types/types'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const getImportScopeCategories = (type: ImportDocumentType, parsedCategories: string[] = []) => {
  const baseCategories =
    type === 'menu'
      ? foodMenuItemCategories
      : type === 'drinks'
        ? drinkMenuItemCategories
        : type === 'full'
          ? [...foodMenuItemCategories, ...drinkMenuItemCategories]
          : []

  return Array.from(new Set([...baseCategories, ...parsedCategories]))
}

const importDocumentInput = z.object({
  type: z.enum(['menu', 'drinks', 'full', 'other']),
  documentId: z.string().optional(),
})

type ImportDocumentInput = z.infer<typeof importDocumentInput>

const reviewedImportItemInput = z.object({
  category: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  price: z.number().finite().min(0),
})

const reviewedImportInput = importDocumentInput.extend({
  items: z.array(reviewedImportItemInput).default([]),
})

type MenuOcrJob =
  | {
      status: 'processing'
      message: string
      createdAt: number
    }
  | {
      status: 'completed'
      message: string
      createdAt: number
      result: Awaited<ReturnType<typeof buildMenuImportPreviewFromItems>> & {
        documentUrl: string
        ocrText: string
        ocrPages: Array<{ pageNumber: number; text: string }>
        items: ParsedMenuImportItem[]
      }
    }
  | {
      status: 'failed'
      message: string
      createdAt: number
    }

const menuOcrJobs = new Map<string, MenuOcrJob>()

const cleanupMenuOcrJobs = () => {
  const now = Date.now()
  const maxAgeMs = 30 * 60 * 1000
  for (const [jobId, job] of menuOcrJobs) {
    if (now - job.createdAt > maxAgeMs) {
      menuOcrJobs.delete(jobId)
    }
  }
}

const normalizeReviewedItems = (items: z.infer<typeof reviewedImportItemInput>[]): ParsedMenuImportItem[] =>
  items
    .map((item) => ({
      category: item.category.trim(),
      name: item.name.trim(),
      price: Number(item.price),
      description: item.description?.trim() ? item.description.trim() : null,
    }))
    .filter((item) => item.category && item.name && Number.isFinite(item.price))

const getMenuDocumentById = async (documentId: string) => {
  const settings = await prisma.settings.findFirst({
    select: {
      menuDocuments: true,
    },
  })

  const documents = Array.isArray(settings?.menuDocuments)
    ? (settings.menuDocuments as unknown as MenuDownloadDocument[])
    : []

  const document = documents.find((item) => item.id === documentId)
  if (!document) {
    throw new Error('Nie znaleziono wybranego pliku PDF w ustawieniach menu.')
  }

  return document
}

const resolveImportDocument = async (input: ImportDocumentInput) => {
  if (!input.documentId) {
    return {
      type: input.type,
      documentId: undefined,
      documentUrl: undefined,
    }
  }

  const document = await getMenuDocumentById(input.documentId)
  if (document.type === 'other') {
    throw new Error('Import pozycji jest dostępny tylko dla dokumentów typu Menu, Napoje albo Pełna karta.')
  }

  return {
    type: document.type,
    documentId: document.id,
    documentUrl: document.url,
  }
}

const getParsedImportItems = async (input: ImportDocumentInput) => {
  const document = await resolveImportDocument(input)
  const parsedItems = await parseMenuDocumentForImport(document.type, document.documentUrl)

  return {
    ...document,
    parsedItems,
  }
}

const isPresent = <T,>(value: T | null): value is T => value !== null

const buildMenuImportPreview = async (input: ImportDocumentInput) => {
  const { type, documentId, parsedItems } = await getParsedImportItems(input)
  return buildMenuImportPreviewFromItems(type, parsedItems, documentId)
}

const buildMenuImportPreviewFromItems = async (
  type: ImportDocumentType,
  parsedItems: ParsedMenuImportItem[],
  documentId?: string,
) => {
  const parsedByKey = new Map(parsedItems.map((item) => [getMenuImportKey(item), item]))
  const scopeCategories = getImportScopeCategories(type, parsedItems.map((item) => item.category))
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
    documentId,
    total: parsedItems.length,
    created,
    updated,
    unchanged,
    missing,
  }
}

const saveMenuImportItems = async (
  type: ImportDocumentType,
  parsedItems: ParsedMenuImportItem[],
  archiveMissingIds: string[],
) => {
  const scopeCategories = getImportScopeCategories(type, parsedItems.map((item) => item.category))
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
          isOrderable: !isAlcoholMenuCategory(item.category),
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
        isOrderable: !isAlcoholMenuCategory(item.category),
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
  if (archiveMissingIds.length > 0) {
    const result = await prisma.menuItem.updateMany({
      where: {
        id: {
          in: archiveMissingIds,
        },
        category: {
          in: scopeCategories,
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
          isOrderable: isAlcoholMenuCategory(input.category) ? false : input.isOrderable,
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

  updateMenuCategory: publicProcedure
    .input(
      z.object({
        category: z.string(),
        isActive: z.boolean().optional(),
        isOrderable: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { category, isActive, isOrderable } = input
      const data: { isActive?: boolean; isOrderable?: boolean } = {}

      if (typeof isActive === 'boolean') data.isActive = isActive
      if (typeof isOrderable === 'boolean') {
        data.isOrderable = isAlcoholMenuCategory(category) ? false : isOrderable
      }

      if (Object.keys(data).length === 0) {
        return { count: 0 }
      }

      return prisma.menuItem.updateMany({
        where: {
          category,
          isArchived: false,
        },
        data,
      })
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
    .input(importDocumentInput)
    .mutation(async ({ input }) => {
      return buildMenuImportPreview(input)
    }),

  recognizeMenuDocumentWithOcr: publicProcedure
    .input(importDocumentInput)
    .mutation(async ({ input }) => {
      const document = await resolveImportDocument(input)
      if (!document.documentUrl) {
        throw new Error('OCR działa tylko dla wgranego pliku PDF.')
      }

      const result = await parseMenuDocumentWithOcr(document.documentUrl)
      const preview = await buildMenuImportPreviewFromItems(document.type, result.items, document.documentId)

      return {
        ...preview,
        documentUrl: document.documentUrl,
        ocrText: result.text,
        ocrPages: result.pages,
        items: result.items,
      }
    }),

  startMenuDocumentOcr: publicProcedure
    .input(importDocumentInput)
    .mutation(async ({ input }) => {
      cleanupMenuOcrJobs()

      const document = await resolveImportDocument(input)
      if (!document.documentUrl) {
        throw new Error('OCR działa tylko dla wgranego pliku PDF.')
      }

      const jobId = randomUUID()
      menuOcrJobs.set(jobId, {
        status: 'processing',
        message: 'Rozpoznajemy tekst z PDF-a. To może potrwać kilka minut przy dużych plikach.',
        createdAt: Date.now(),
      })

      void (async () => {
        try {
          const result = await parseMenuDocumentWithOcr(document.documentUrl!)
          const preview = await buildMenuImportPreviewFromItems(document.type, result.items, document.documentId)

          menuOcrJobs.set(jobId, {
            status: 'completed',
            message: `OCR rozpoznał ${result.items.length} pozycji. Sprawdź je przed zapisem.`,
            createdAt: Date.now(),
            result: {
              ...preview,
              documentUrl: document.documentUrl!,
              ocrText: result.text,
              ocrPages: result.pages,
              items: result.items,
            },
          })
        } catch (error) {
          console.error(error)
          menuOcrJobs.set(jobId, {
            status: 'failed',
            message: error instanceof Error ? error.message : 'Nie udało się wykonać OCR pliku PDF.',
            createdAt: Date.now(),
          })
        }
      })()

      return {
        jobId,
        status: 'processing' as const,
        message: 'OCR został uruchomiony. Możesz poczekać na wynik w tym oknie.',
      }
    }),

  getMenuDocumentOcrJob: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(({ input }) => {
      cleanupMenuOcrJobs()

      const job = menuOcrJobs.get(input.jobId)
      if (!job) {
        return {
          status: 'failed' as const,
          message: 'Nie znaleziono zadania OCR. Uruchom rozpoznawanie ponownie.',
        }
      }

      return job
    }),

  previewReviewedMenuImport: publicProcedure
    .input(reviewedImportInput)
    .mutation(async ({ input }) => {
      const document = await resolveImportDocument(input)
      const items = normalizeReviewedItems(input.items)
      return buildMenuImportPreviewFromItems(document.type, items, document.documentId)
    }),

  importMenuFromDocument: publicProcedure
    .input(
      importDocumentInput.extend({
        archiveMissingIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const { type, parsedItems } = await getParsedImportItems(input)
      return saveMenuImportItems(type, parsedItems, input.archiveMissingIds)
    }),

  importReviewedMenuItems: publicProcedure
    .input(
      reviewedImportInput.extend({
        archiveMissingIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const document = await resolveImportDocument(input)
      const items = normalizeReviewedItems(input.items)
      return saveMenuImportItems(document.type, items, input.archiveMissingIds)
    }),
})
