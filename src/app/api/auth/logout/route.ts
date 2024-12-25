import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export async function POST() {
	const session = await getServerSession(authOptions)

	if (session) {
		// Видалення сесії
		return NextResponse.json(
			{ message: 'Session ended successfully' },
			{ status: 200, headers: { 'Set-Cookie': 'next-auth.session-token=; Path=/; Max-Age=0' } }
		)
	}

	// Якщо сесія відсутня, просто повертаємо повідомлення
	return NextResponse.json({ message: 'No active session' }, { status: 200 })
}
