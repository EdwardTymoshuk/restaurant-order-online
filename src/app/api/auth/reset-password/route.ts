import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string; password?: string }
    const token = body.token?.trim()
    const password = body.password ?? ''
    if (!token || password.length < 6) {
      return NextResponse.json({ message: 'Link jest nieprawidłowy lub hasło jest za krótkie.' }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return NextResponse.json({ message: 'Link jest nieprawidłowy albo wygasł.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId, id: { not: resetToken.id } } }),
    ])

    return NextResponse.json({ message: 'Hasło zostało zmienione.' })
  } catch (error) {
    console.error('Password reset failed:', error)
    return NextResponse.json({ message: 'Nie udało się zmienić hasła.' }, { status: 500 })
  }
}
