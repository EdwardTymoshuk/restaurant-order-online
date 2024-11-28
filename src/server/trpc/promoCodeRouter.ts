import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, router } from './trpc'

const JWT_SECRET = process.env.JWT_SECRET!

const USER_ROLES = {
	USER: "user",
	ADMIN: "admin",
} as const

function generateToken(payload: { id: string; role: string }): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
}

export const promoCodeRouter = router({
	createPromoCode: protectedProcedure
		.input(
			z.object({
				code: z.string(),
				discountType: z.enum(['FIXED', 'PERCENTAGE']),
				discountValue: z.number(),
				isActive: z.boolean().optional().default(true),
				isOneTimeUse: z.boolean().optional().default(false),
				expiresAt: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const decodedToken = ctx.token

			if (!decodedToken || decodedToken.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Доступ заборонено" })
			}

			const promoCode = await prisma.promoCode.create({
				data: {
					...input,
					discountType: input.discountType,
					expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
				},
			})
			return promoCode
		}),

	getAllPromoCodes: publicProcedure.query(async () => {
		return await prisma.promoCode.findMany()
	}),

	updatePromoCode: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				code: z.string().optional(),
				discountType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
				discountValue: z.number().optional(),
				isActive: z.boolean().optional(),
				isOneTimeUse: z.boolean().optional(),
				expiresAt: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const promoCode = await prisma.promoCode.update({
				where: { id },
				data: {
					...data,
					expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
				},
			})
			return promoCode
		}),

	deletePromoCode: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			await prisma.promoCode.delete({
				where: { id: input.id },
			})
			return { success: true }
		}),
	validatePromoCode: publicProcedure
		.input(
			z.object({
				promoCode: z.string(),
			})
		)
		.query(async ({ input }) => {
			const { promoCode } = input

			const foundCode = await prisma.promoCode.findUnique({
				where: { code: promoCode },
			})
			if (!foundCode) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Kod promocyjny nie istnieje.',
				})
			}

			if (!foundCode.isActive) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny jest nieaktywny.',
				})
			}

			if (foundCode.expiresAt && new Date(foundCode.expiresAt) < new Date()) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny wygasł.',
				})
			}

			if (foundCode.isOneTimeUse && foundCode.isUsed) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny został już wykorzystany.',
				})
			}

			return foundCode
		}),
	markPromoCodeAsUsed: publicProcedure
		.input(
			z.object({
				promoCode: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { promoCode } = input

			const updatedCode = await ctx.prisma.promoCode.update({
				where: { code: promoCode },
				data: { isUsed: true },
			})

			return updatedCode
		}),
})
