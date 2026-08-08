import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ADMIN_HOST = process.env.ADMIN_HOST || 'admin.spokosopot.pl'
const ORDER_HOST = process.env.ORDER_HOST || 'order.spokosopot.pl'

const ADMIN_PREFIX = '/admin-panel'
const CLEAN_LOGIN_PATH = '/auth/login'
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password']
const ADMIN_LOGIN_PATH = `${ADMIN_PREFIX}/auth/login`

function getHostname(req: NextRequest) {
	return (req.headers.get('host') || '').split(':')[0].toLowerCase()
}

function isAdminHost(hostname: string) {
	return hostname === ADMIN_HOST || hostname === `www.${ADMIN_HOST}` || hostname.startsWith('admin.')
}

function isOrderHost(hostname: string) {
	return hostname === ORDER_HOST || hostname === `www.${ORDER_HOST}` || hostname.startsWith('order.')
}

function isPassthroughPath(pathname: string) {
	return (
		pathname.startsWith('/api') ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/img') ||
		pathname === '/favicon.ico' ||
		pathname === '/manifest.webmanifest' ||
		pathname === '/sw.js' ||
		pathname.includes('.')
	)
}

function stripAdminPrefix(pathname: string) {
	const strippedPath = pathname.replace(ADMIN_PREFIX, '') || '/'
	return strippedPath.startsWith('/') ? strippedPath : `/${strippedPath}`
}

export async function middleware(req: NextRequest) {
	const { pathname, search } = req.nextUrl
	const hostname = getHostname(req)
	const onAdminHost = isAdminHost(hostname)
	const onOrderHost = isOrderHost(hostname)

	if (onOrderHost && pathname.startsWith(ADMIN_PREFIX)) {
		const adminUrl = new URL(stripAdminPrefix(pathname), `https://${ADMIN_HOST}`)
		adminUrl.search = search
		return NextResponse.redirect(adminUrl)
	}

	if (onAdminHost && pathname.startsWith(ADMIN_PREFIX)) {
		const cleanUrl = req.nextUrl.clone()
		cleanUrl.pathname = stripAdminPrefix(pathname)
		return NextResponse.redirect(cleanUrl)
	}

	if (isPassthroughPath(pathname)) {
		return NextResponse.next()
	}

	const token = await getToken({
		req,
		secret: process.env.NEXTAUTH_SECRET,
		cookieName: 'spoko-admin.session-token',
	})

	if (onAdminHost) {
		if (!PUBLIC_AUTH_PATHS.includes(pathname) && !token) {
			const loginUrl = req.nextUrl.clone()
			loginUrl.pathname = CLEAN_LOGIN_PATH
			loginUrl.search = ''
			return NextResponse.redirect(loginUrl)
		}

		const internalUrl = req.nextUrl.clone()
		internalUrl.pathname = pathname === '/' ? ADMIN_PREFIX : `${ADMIN_PREFIX}${pathname}`
		return NextResponse.rewrite(internalUrl)
	}

	const loginUrl = new URL(ADMIN_LOGIN_PATH, req.url)

	if ([ADMIN_LOGIN_PATH, `${ADMIN_PREFIX}/auth/forgot-password`, `${ADMIN_PREFIX}/auth/reset-password`].some((path) => pathname.startsWith(path))) {
		return NextResponse.next()
	}

	if (!token && pathname.startsWith(ADMIN_PREFIX)) {
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico).*)',
	],
}
