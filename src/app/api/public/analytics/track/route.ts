import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const allowedOrigins = new Set([
  'https://spokosopot.pl',
  'https://www.spokosopot.pl',
  'https://order.spokosopot.pl',
  'https://www.order.spokosopot.pl',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
])

const botPattern =
  /bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp|telegram|slackbot|discordbot|linkedinbot/i

type TrackPayload = {
  eventName?: string
  path?: string
  url?: string
  title?: string
  referrer?: string
  visitorId?: string
  sessionId?: string
}

function corsHeaders(origin: string | null) {
  const headers = new Headers()
  if (origin && allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
  }
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

function json(data: unknown, init: ResponseInit = {}, origin: string | null = null) {
  const headers = corsHeaders(origin)
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value))
  }
  return NextResponse.json(data, { ...init, headers })
}

function safeString(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : undefined
}

function parseUrl(value?: string) {
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function getHost(value?: string) {
  return parseUrl(value)?.hostname.toLowerCase()
}

function detectDevice(userAgent: string) {
  if (/ipad|tablet|kindle/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return 'Edge'
  if (/chrome|crios/i.test(userAgent)) return 'Chrome'
  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) return 'Safari'
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox'
  return 'Other'
}

function detectOs(userAgent: string) {
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS'
  if (/android/i.test(userAgent)) return 'Android'
  if (/mac os|macintosh/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  return 'Other'
}

function hash(value?: string) {
  if (!value) return undefined
  const salt = process.env.ANALYTICS_SALT || process.env.NEXTAUTH_SECRET || 'spoko-analytics'
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return headers.get('cf-connecting-ip') || headers.get('x-real-ip') || forwardedFor || undefined
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigins.has(origin)) {
    return json({ ok: false }, { status: 403 }, origin)
  }

  const userAgent = request.headers.get('user-agent') || ''
  if (botPattern.test(userAgent)) {
    return json({ ok: true, ignored: true }, {}, origin)
  }

  let body: TrackPayload
  try {
    body = await request.json()
  } catch {
    return json({ ok: false }, { status: 400 }, origin)
  }

  const url = safeString(body.url, 1000)
  const parsedUrl = parseUrl(url)
  const site = parsedUrl?.hostname.toLowerCase() || getHost(origin ?? undefined) || 'unknown'
  const path = safeString(body.path, 300) || parsedUrl?.pathname || '/'

  if (site.includes('admin.')) {
    return json({ ok: true, ignored: true }, {}, origin)
  }

  const referrer = safeString(body.referrer, 1000)
  const ip = getClientIp(request.headers)

  await prisma.analyticsEvent.create({
    data: {
      site,
      eventName: safeString(body.eventName, 80) || 'page_view',
      path,
      url,
      title: safeString(body.title, 200),
      referrer,
      referrerHost: getHost(referrer),
      utmSource: parsedUrl?.searchParams.get('utm_source')?.slice(0, 100),
      utmMedium: parsedUrl?.searchParams.get('utm_medium')?.slice(0, 100),
      utmCampaign: parsedUrl?.searchParams.get('utm_campaign')?.slice(0, 160),
      visitorHash: hash(body.visitorId || `${ip ?? ''}:${userAgent}`),
      sessionHash: hash(body.sessionId),
      country: request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country'),
      region: request.headers.get('x-vercel-ip-country-region'),
      city: request.headers.get('x-vercel-ip-city'),
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOs(userAgent),
      userAgent: userAgent.slice(0, 500),
    },
  })

  return json({ ok: true }, {}, origin)
}
