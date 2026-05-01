import { prisma } from '@/lib/prisma'
import { inferAsyncReturnType } from '@trpc/server'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { decode } from 'next-auth/jwt'

interface CustomJwtPayload extends JwtPayload {
	id: string
	role: "user" | "admin"
}

const parseCookies = (cookieHeader: string) =>
	Object.fromEntries(
		cookieHeader.split(';').map((c) => {
			const [k, ...v] = c.trim().split('=')
			return [k.trim(), decodeURIComponent(v.join('='))]
		})
	)

export async function createContext({ req }: { req: Request }) {
	let token: CustomJwtPayload | null = null

	// 1. Try Bearer token from Authorization header
	const authHeader = req.headers.get('authorization')
	if (authHeader?.startsWith('Bearer ')) {
		try {
			const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET!) as unknown as CustomJwtPayload
			if (decoded?.id && decoded?.role) token = decoded
		} catch { /* invalid */ }
	}

	// 2. Fallback: decode NextAuth session cookie from the request
	if (!token) {
		try {
			const cookieHeader = req.headers.get('cookie') ?? ''
			const cookies = parseCookies(cookieHeader)
			const sessionToken = cookies['spoko-admin.session-token']
			if (sessionToken) {
				const decoded = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! })
				if (decoded?.id) {
					token = {
						id: decoded.id as string,
						role: (decoded.role as "user" | "admin") ?? 'user',
						iat: (decoded.iat as number) ?? 0,
						exp: (decoded.exp as number) ?? 0,
					}
				}
			}
		} catch { /* not authenticated */ }
	}

	return { token, user: token, prisma }
}

export type Context = inferAsyncReturnType<typeof createContext>
