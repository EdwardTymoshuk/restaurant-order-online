import { prisma } from '@/lib/prisma'
import { inferAsyncReturnType } from '@trpc/server'
import jwt, { JwtPayload } from 'jsonwebtoken'

// Оголошуємо CustomJwtPayload
interface CustomJwtPayload extends JwtPayload {
	id: string
	role: "user" | "admin"
}

export async function createContext({ req }: { req: Request }) {
	let token: CustomJwtPayload | null = null

	const authHeader = req.headers.get('authorization')

	if (authHeader && authHeader.startsWith('Bearer ')) {
		const tokenString = authHeader.substring(7)
		try {
			// Приведення до unknown перед приведенням до CustomJwtPayload
			const decodedToken = jwt.verify(tokenString, process.env.JWT_SECRET!) as unknown as JwtPayload & CustomJwtPayload

			// Перевіряємо, чи decodedToken має потрібні поля
			if (decodedToken && typeof decodedToken === 'object' && 'id' in decodedToken && 'role' in decodedToken) {
				token = decodedToken as CustomJwtPayload
			}
		} catch (error) {
			console.error("Invalid token:", error)
		}
	}

	return {
		token,
		user: token,
		prisma,
	}
}

export type Context = inferAsyncReturnType<typeof createContext>
