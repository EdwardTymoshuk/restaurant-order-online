// /app/api/auth/[...nextauth]/route.ts

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const JWT_SECRET = process.env.JWT_SECRET!

// Налаштування NextAuth
export const authOptions: AuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				identifier: { label: 'Username or Email', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.identifier || !credentials?.password) return null

				const user = await prisma.user.findFirst({
					where: {
						OR: [
							{ email: credentials.identifier, role: 'admin' },
							{ username: credentials.identifier },
						],
					},
				})

				if (user && bcrypt.compareSync(credentials.password, user.password)) {
					const accessToken = jwt.sign(
						{ id: user.id, role: user.role },
						JWT_SECRET
					)
					return { id: user.id, name: user.username || user.email, role: user.role, accessToken }
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
				session.user.accessToken = token.accessToken as string
			}
			return session
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id
				token.role = user.role
				token.accessToken = user.accessToken // Додаємо accessToken
			}
			return token
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
}

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
