// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
	interface Session {
		user?: {
			id: string
			role?: string
			userName?: string
			accessToken: string
		} & DefaultSession["user"]
	}

	interface User extends DefaultUser {
		role?: string
		accessToken: string
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string
		role?: string
	}
}
