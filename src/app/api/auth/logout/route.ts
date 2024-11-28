import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../[...nextauth]/route'

export async function POST() {
	const session = await getServerSession(authOptions)

	if (session) {
		console.log(`Logging out user with id: ${session.user?.id}`)

		// Видалення сесії
		return NextResponse.json(
			{ message: 'Session ended successfully' },
			{ status: 200, headers: { 'Set-Cookie': 'next-auth.session-token=; Path=/; Max-Age=0' } }
		)
	}

	// Якщо сесія відсутня, просто повертаємо повідомлення
	return NextResponse.json({ message: 'No active session' }, { status: 200 })
}
