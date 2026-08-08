// server/trpc/routers/user.ts
import { prisma } from "@/lib/prisma"
import { publicProcedure, router } from "@/server/trpc"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"

const JWT_SECRET = process.env.JWT_SECRET!

const USER_ROLES = {
	USER: "user",
	MANAGER: "manager",
	ADMIN: "admin",
} as const

function generateToken(payload: { id: string; role: string }): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
}

export const userRouter = router({
	register: publicProcedure
		.input(
			z.object({
				username: z.string(),
				password: z.string(),
				role: z.enum(["user", "manager", "admin"]).default("user"),
			})
		)
		.mutation(async ({ input }) => {
			const hashedPassword = await bcrypt.hash(input.password, 10)
			return await prisma.user.create({
				data: {
					username: input.username,
					password: hashedPassword,
					role: input.role,
				},
			})
		}),

	login: publicProcedure
		.input(z.object({ email: z.string().email(), password: z.string() }))
		.mutation(async ({ input }) => {
			const user = await prisma.user.findFirst({ where: { email: input.email.toLowerCase() } })

			// Перевірка пароля

			if (!user || !(await bcrypt.compare(input.password, user.password))) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Невірний логін або пароль" })
			}

			// Генерація токена
			const token = generateToken({ id: user.id, role: user.role })

			return { token, role: user.role }
		}),

	createUser: publicProcedure
		.input(z.object({ username: z.string(), email: z.string().email(), password: z.string().min(6), name: z.string().optional(), role: z.enum(["user", "manager", "admin"]), permissions: z.array(z.string()).default([]) }))
		.mutation(async ({ input, ctx }) => {
			const decodedToken = ctx.token

			if (!decodedToken || decodedToken.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Доступ заборонено" })
			}

			const hashedPassword = await bcrypt.hash(input.password, 10)
			return await prisma.user.create({
				data: {
					username: input.username,
					email: input.email.toLowerCase(),
					password: hashedPassword,
					name: input.name,
					role: input.role,
					permissions: input.permissions,
				},
			})
		}),
	getAllUsers: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.token || ctx.token.role !== USER_ROLES.ADMIN) {
			throw new TRPCError({ code: 'FORBIDDEN', message: 'Brak uprawnień.' })
		}
		try {
			const users = await prisma.user.findMany({
				select: { id: true, username: true, email: true, name: true, role: true, permissions: true },
				orderBy: { email: 'asc' },
			})
			return users
		} catch (error) {
			throw new Error('Failed to fetch users')
		}
	}),
	deleteUser: publicProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			if (!ctx.token || ctx.token.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Brak uprawnień.' })
			}
			try {
				await prisma.user.delete({ where: { id: input.userId } })
				return { success: true }
			} catch {
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Nie udało się usunąć użytkownika.' })
			}
		}),

	updateUser: publicProcedure
		.input(z.object({
			userId: z.string(),
			name: z.string().optional(),
			email: z.string().email().optional(),
			role: z.enum(['user', 'manager', 'admin']).optional(),
			permissions: z.array(z.string()).optional(),
		}))
		.mutation(async ({ input, ctx }) => {
			if (!ctx.token || ctx.token.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Brak uprawnień.' })
			}
			const { userId, ...data } = input
			return await prisma.user.update({ where: { id: userId }, data: { ...data, email: data.email?.toLowerCase() } })
		}),

	resetPassword: publicProcedure
		.input(z.object({
			userId: z.string(),
			newPassword: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków.'),
		}))
		.mutation(async ({ input, ctx }) => {
			if (!ctx.token || ctx.token.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Brak uprawnień.' })
			}
			const hashed = await bcrypt.hash(input.newPassword, 10)
			await prisma.user.update({ where: { id: input.userId }, data: { password: hashed } })
			return { success: true }
		}),
})
