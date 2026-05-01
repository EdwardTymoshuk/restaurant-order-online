import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const summaryPdf = await prisma.reservationSummaryPdf.findUnique({
    where: { reservationId: params.id },
  })

  if (!summaryPdf) {
    return new NextResponse('PDF not found', { status: 404 })
  }

  const filename = encodeURIComponent(summaryPdf.filename)

  return new NextResponse(summaryPdf.content, {
    headers: {
      'Content-Type': summaryPdf.mimeType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
