// src/server/trpc/trpc.ts
import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { Context } from './context'

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape
	},
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" })
	}
	return next({ ctx })
})

export const permissionProcedure = (permission: string) =>
	protectedProcedure.use(({ ctx, next }) => {
		const user = ctx.user
		if (!user || (user.role !== 'admin' && !user.permissions?.includes(permission))) {
			throw new TRPCError({ code: 'FORBIDDEN', message: 'Brak uprawnień.' })
		}
		return next()
	})

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (ctx.user?.role !== 'admin') {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Ta operacja jest dostępna tylko dla administratora.' })
	}
	return next()
})
