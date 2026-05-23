import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const galleryCategorySchema = z.enum([
  'dishes',
  'terrace',
  'interior',
  'events',
  'details',
])

const galleryImageInput = z.object({
  title: z.string().min(1),
  alt: z.string().optional().nullable(),
  src: z.string().min(1),
  thumbnail: z.string().optional().nullable(),
  category: galleryCategorySchema.default('details'),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const galleryRouter = router({
  getGalleryImages: publicProcedure.query(async () => {
    return prisma.galleryImage.findMany({
      where: { isArchived: false },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  }),

  createGalleryImage: publicProcedure
    .input(galleryImageInput)
    .mutation(async ({ input }) => {
      return prisma.galleryImage.create({
        data: {
          ...input,
          alt: input.alt || input.title,
          thumbnail: input.thumbnail || input.src,
        },
      })
    }),

  updateGalleryImage: publicProcedure
    .input(galleryImageInput.partial().extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input

      return prisma.galleryImage.update({
        where: { id },
        data: {
          ...data,
          thumbnail:
            data.thumbnail === null || data.thumbnail === ''
              ? data.src
              : data.thumbnail,
        },
      })
    }),

  deleteGalleryImage: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.galleryImage.update({
        where: { id: input.id },
        data: { isArchived: true, isActive: false },
      })

      return { success: true }
    }),
})
