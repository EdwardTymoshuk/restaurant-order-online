import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })

    const response = NextResponse.json(news)
    response.headers.set('Cache-Control', 'no-store')

    return response
  } catch (error) {
    console.error('Error fetching public news:', error)
    return NextResponse.json(
      { message: 'Error fetching news' },
      { status: 500 }
    )
  }
}
