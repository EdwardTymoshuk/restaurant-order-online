import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const banners = await prisma.mainBanner.findMany({
      orderBy: { position: 'asc' },
    })

    const response = NextResponse.json(banners)
    response.headers.set('Cache-Control', 'no-store')

    return response
  } catch (error) {
    console.error('Error fetching public main banners:', error)
    return NextResponse.json(
      { message: 'Error fetching main banners' },
      { status: 500 }
    )
  }
}
