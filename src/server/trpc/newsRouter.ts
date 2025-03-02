import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

export const newsRouter = router({
  // Fetch all events from the database
  getNews: publicProcedure.query(async () => {
    return await prisma.news.findMany({ orderBy: { createdAt: 'desc' } })
  }),

  // Create a new event
  createNews: publicProcedure
    .input(
      z.object({
        title: z.string(),
        image: z.string(),
        description: z.string(),
        fullDescription: z.string(),
        galleryImages: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.news.create({ data: input })
    }),

  // Update an existing event
  updateNews: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        fullDescription: z.string().optional(),
        galleryImages: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.news.update({
        where: { id: input.id },
        data: {
          title: input.title,
          image: input.image,
          description: input.description,
          fullDescription: input.fullDescription,
          galleryImages: input.galleryImages,
        },
      })
    }),

  // Delete an event by ID
  deleteNews: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.news.delete({ where: { id: input.id } })
    }),
})
