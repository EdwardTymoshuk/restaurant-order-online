// middleware.ts
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

	// Перевіряємо, чи користувач неавторизований і намагається зайти на сторінку адміністратора
	if (!token && req.nextUrl.pathname.startsWith('/admin-panel')) {
		// Перенаправлення на сторінку логування
		return NextResponse.redirect(new URL('/auth/login', req.url))
	}

	return NextResponse.next()
}

// Вказуємо, на які маршрути застосовується middleware
export const config = {
	matcher: ['/admin-panel/:path*'], // Застосовувати лише для сторінок в адмін панелі
}
