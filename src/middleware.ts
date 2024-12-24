import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
	// Retrieve the user's token
	const token = await getToken({ req })

	// Check if the current path is the login page
	if (req.nextUrl.pathname.startsWith('/admin-panel/auth/login')) {
		return NextResponse.next()
	}

	// Redirect to login if the user is not authenticated
	if (!token) {
		return NextResponse.redirect(new URL('/admin-panel/auth/login', req.url))
	}

	// Allow the authenticated user to proceed
	return NextResponse.next()
}

// Apply the middleware to all routes under /admin-panel
export const config = {
	matcher: ['/admin-panel/:path*'],
}
