import { getWebPushPublicKey } from '@/lib/pushNotifications'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const publicKey = getWebPushPublicKey()

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Web Push is not configured.' },
      { status: 503 }
    )
  }

  return NextResponse.json({ publicKey })
}
