import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: 'spoko-admin.session-token' })
	const loginUrl = new URL('/admin-panel/auth/login', req.url)

	if (req.nextUrl.pathname.startsWith('/admin-panel/auth/login')) {
		return NextResponse.next()
	}

	if (!token) {
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/admin-panel/:path*'],
}
