import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { publicProcedure, router } from './trpc'

const JWT_SECRET = process.env.JWT_SECRET!

const USER_ROLES = {
	USER: "user",
	ADMIN: "admin",
} as const

function generateToken(payload: { id: string; role: string }): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
}

export const promoCodeRouter = router({
	createPromoCode: publicProcedure
		.input(
			z.object({
				code: z.string(),
				discountType: z.enum(['FIXED', 'PERCENTAGE']),
				discountValue: z.number(),
				isActive: z.boolean().optional().default(true),
				isOneTimeUse: z.boolean().optional().default(false),
				expiresAt: z.string().optional(),
				startDate: z.string().optional(),
			  })
		)
		.mutation(async ({ input, ctx }) => {
			const decodedToken = ctx.token

			// if (!decodedToken || decodedToken.role !== USER_ROLES.ADMIN) {
			// 	throw new TRPCError({ code: "FORBIDDEN", message: "Dostęp wzbroniony" })
			// }

			const promoCode = await prisma.promoCode.create({
				data: {
					...input,
					discountType: input.discountType,
					expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
					startDate: input.startDate ? new Date(input.startDate) : null,
				},
			})
			return promoCode
		}),

	getAllPromoCodes: publicProcedure.query(async () => {
		return await prisma.promoCode.findMany()
	}),

	updatePromoCode: publicProcedure
		.input(
			z.object({
				id: z.string(),
				code: z.string().optional(),
				discountType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
				discountValue: z.number().optional(),
				isActive: z.boolean().optional(),
				isOneTimeUse: z.boolean().optional(),
				expiresAt: z.string().optional(),
				startDate: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const promoCode = await prisma.promoCode.update({
				where: { id },
				data: {
					...data,
					expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
					startDate: data.startDate ? new Date(data.startDate) : undefined,
				},
			})
			return promoCode
		}),

	deletePromoCode: publicProcedure
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
				deliveryDate: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const { promoCode, deliveryDate } = input

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

			if (foundCode.isOneTimeUse && foundCode.isUsed) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny został już wykorzystany.',
				})
			}

			if (deliveryDate) {
				const delivery = new Date(deliveryDate);
				
				if (foundCode.startDate && delivery < foundCode.startDate) {
				  throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny jeszcze nie obowiązuje dla tej daty.',
				  });
				}
		  
				if (foundCode.expiresAt && delivery > foundCode.expiresAt) {
				  throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny nie obowiązuje w wybranym terminie.',
				  });
				}
			  } else {
				const now = new Date()
				if (foundCode.startDate && foundCode.startDate > now) {
				  throw new TRPCError({ 
					code: 'BAD_REQUEST', 
					message: 'Kod promocyjny jeszcze nie obowiązuje.' 
				  });
				}
				if (foundCode.expiresAt && foundCode.expiresAt < now) {
				  throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Kod promocyjny już wygasł.',
				  });
				}
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
