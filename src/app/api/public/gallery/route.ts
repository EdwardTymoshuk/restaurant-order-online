import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    const response = NextResponse.json(images)
    response.headers.set('Cache-Control', 'no-store')

    return response
  } catch (error) {
    console.error('Error fetching public gallery:', error)
    return NextResponse.json(
      { message: 'Error fetching gallery' },
      { status: 500 }
    )
  }
}
