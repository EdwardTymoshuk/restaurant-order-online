// middleware.ts
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
	// Отримуємо токен користувача
	const token = await getToken({ req })

	// Перевіряємо, чи користувач залогований і є адміністратором
	if (!token || token.role !== 'admin') {
		// Якщо немає токена або роль не адмін — перенаправляємо на сторінку входу
		return NextResponse.redirect(new URL('/auth/login', req.url))
	}

	// Якщо користувач адміністратор, продовжуємо
	return NextResponse.next()
}

// Застосовуємо middleware тільки для конкретного шляху (наприклад, для налаштувань)
export const config = {
	matcher: ['/admin-panel/settings'],
}
