import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { permissionProcedure, publicProcedure, router } from '../trpc'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toNullableDate = (value?: string | Date | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const createUniqueSlug = async (title: string, currentId?: string) => {
  const base = slugify(title) || 'aktualnosc'
  let slug = base
  let suffix = 2

  while (
    await prisma.news.findFirst({
      where: {
        slug,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}

const newsInput = z.object({
  title: z.string().min(1),
  image: z.string().min(1),
  description: z.string().min(1),
  fullDescription: z.string().optional().default(''),
  galleryImages: z.array(z.string()).default([]),
  publishedAt: z.string().optional().nullable(),
  eventStartDate: z.string().optional().nullable(),
  eventEndDate: z.string().optional().nullable(),
  isEnded: z.boolean().optional().default(false),
})

export const newsRouter = router({
  // Fetch all events from the database
  getNews: publicProcedure.query(async () => {
    return await prisma.news.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
  }),

  // Create a new event
  createNews: permissionProcedure('settings.manage')
    .input(newsInput)
    .mutation(async ({ input }) => {
      const slug = await createUniqueSlug(input.title)

      return await prisma.news.create({
        data: {
          title: input.title,
          slug,
          image: input.image,
          description: input.description,
          fullDescription: input.fullDescription,
          galleryImages: input.galleryImages,
          publishedAt: toNullableDate(input.publishedAt) ?? new Date(),
          eventStartDate: toNullableDate(input.eventStartDate),
          eventEndDate: toNullableDate(input.eventEndDate),
          isEnded: input.isEnded,
        },
      })
    }),

  // Update an existing event
  updateNews: permissionProcedure('settings.manage')
    .input(
      newsInput.partial().extend({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.news.findUnique({ where: { id: input.id } })
      if (!existing) throw new Error('News item not found')

      return await prisma.news.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug:
            input.title && input.title !== existing.title
              ? await createUniqueSlug(input.title, input.id)
              : undefined,
          image: input.image,
          description: input.description,
          fullDescription: input.fullDescription,
          galleryImages: input.galleryImages,
          publishedAt:
            input.publishedAt !== undefined
              ? toNullableDate(input.publishedAt) ?? existing.publishedAt
              : undefined,
          eventStartDate:
            input.eventStartDate !== undefined
              ? toNullableDate(input.eventStartDate)
              : undefined,
          eventEndDate:
            input.eventEndDate !== undefined
              ? toNullableDate(input.eventEndDate)
              : undefined,
          isEnded: input.isEnded,
        },
      })
    }),

  // Delete an event by ID
  deleteNews: permissionProcedure('settings.manage')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.news.delete({ where: { id: input.id } })
    }),
})
