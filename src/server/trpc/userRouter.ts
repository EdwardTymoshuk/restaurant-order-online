// server/trpc/routers/user.ts
import { prisma } from "@/lib/prisma"
import { protectedProcedure, publicProcedure, router } from "@/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"

const JWT_SECRET = process.env.JWT_SECRET!

const USER_ROLES = {
	USER: "user",
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
				role: z.enum(["user", "admin"]).default("user"),
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
		.input(z.object({ identifier: z.string(), password: z.string() }))
		.mutation(async ({ input }) => {
			// Перевірка, чи `identifier` є email чи username
			const isEmail = input.identifier.includes('@')

			// Використовуємо різний пошук залежно від ролі
			const user = await prisma.user.findFirst({
				where: isEmail
					? { email: input.identifier, role: USER_ROLES.ADMIN } // Логін через email для адміністратора
					: { username: input.identifier }, // Логін через username для звичайного користувача
			})

			// Перевірка пароля

			if (!user || !(await bcrypt.compare(input.password, user.password))) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Невірний логін або пароль" })
			}

			// Генерація токена
			const token = generateToken({ id: user.id, role: user.role })

			return { token, role: user.role }
		}),

	createUser: protectedProcedure
		.input(z.object({ username: z.string(), password: z.string(), name: z.string().optional(), role: z.enum(["user", "admin"]) }))
		.mutation(async ({ input, ctx }) => {
			const decodedToken = ctx.token

			if (!decodedToken || decodedToken.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Доступ заборонено" })
			}

			const hashedPassword = await bcrypt.hash(input.password, 10)
			return await prisma.user.create({
				data: {
					username: input.username,
					password: hashedPassword,
					name: input.name,
					role: input.role,
				},
			})
		}),
	getAllUsers: publicProcedure.query(async () => {
		try {
			const users = await prisma.user.findMany()
			return users
		} catch (error) {
			throw new Error('Failed to fetch users')
		}
	}),
	deleteUser: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const decodedToken = ctx.token

			if (!decodedToken || decodedToken.role !== USER_ROLES.ADMIN) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Доступ заборонено" })
			}

			try {
				await prisma.user.delete({
					where: { id: input.userId },
				})
				return { message: 'User deleted successfully' }
			} catch (error) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete user" })
			}
		}),
})
