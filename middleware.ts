// middleware.ts
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
	const loginUrl = new URL('/admin-panel/auth/login', req.url)

	if (req.nextUrl.pathname.startsWith('/admin-panel/auth/login')) {
		return NextResponse.next()
	}

	if (!token && req.nextUrl.pathname.startsWith('/admin-panel')) {
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

// Вказуємо, на які маршрути застосовується middleware
export const config = {
	matcher: ['/admin-panel/:path*', '/api/trpc/settings.updateOrderingState', '/api/trpc/settings.updateDeliveryCost', '/api/trpc/settings.updateOrderWaitTime', '/api/trpc/settings.updateDeliveryZonePrices'],
};
