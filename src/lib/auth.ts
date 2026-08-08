import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const JWT_SECRET = process.env.JWT_SECRET!

// Налаштування NextAuth
export const authOptions: AuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				identifier: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.identifier || !credentials?.password) return null

				const user = await prisma.user.findFirst({
					where: { email: credentials.identifier.trim().toLowerCase() },
				})

				if (user && bcrypt.compareSync(credentials.password, user.password)) {
					const accessToken = jwt.sign(
						{ id: user.id, role: user.role, permissions: user.permissions },
						JWT_SECRET,
						{ expiresIn: '2h' }
					)
					const permissions = Array.isArray(user.permissions) ? (user.permissions as unknown[]).filter((value): value is string => typeof value === 'string') : []
					return { id: user.id, name: user.name || user.email, email: user.email, role: user.role, permissions, accessToken }
				}
				return null
			},
		}),
	],
	callbacks: {
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string
				session.user.role = token.role
				session.user.permissions = Array.isArray(token.permissions) ? token.permissions as string[] : []
				session.user.accessToken = token.accessToken as string
			}
			return session
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id
				token.role = user.role
				token.permissions = Array.isArray(user.permissions) ? user.permissions as string[] : []
				token.accessToken = user.accessToken // Додаємо accessToken
			}
			if (token.id && !token.permissions) {
				const currentUser = await prisma.user.findUnique({ where: { id: token.id }, select: { permissions: true, role: true } })
				token.role = currentUser?.role ?? token.role
				token.permissions = Array.isArray(currentUser?.permissions)
					? (currentUser.permissions as unknown[]).filter((value): value is string => typeof value === 'string')
					: []
			}
			return token
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: 'jwt',
		maxAge: 2 * 60 * 60, // 2 hours
	},
	jwt: {
		maxAge: 2 * 60 * 60, // 2 hours
	},
	cookies: {
		sessionToken: {
			name: 'spoko-admin.session-token',
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: process.env.NODE_ENV === 'production',
			},
		},
	},
}
