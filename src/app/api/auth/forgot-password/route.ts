import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const genericResponse = () => NextResponse.json({ message: 'Jeśli konto ma przypisany email, wyślemy na niego instrukcję resetu hasła.' })

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string }
    const identifier = body.identifier?.trim().toLowerCase()
    if (!identifier) return genericResponse()

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }], role: 'admin' },
      select: { id: true, email: true, username: true },
    })

    if (!user?.email) return genericResponse()

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    })

    const smtpOptions: SMTPTransport.Options = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    }
    const transporter = nodemailer.createTransport(smtpOptions)
    const baseUrl = (process.env.NEXTAUTH_URL || 'https://admin.spokosopot.pl').replace(/\/$/, '')
    const resetUrl = `${baseUrl}/admin-panel/auth/reset-password?token=${rawToken}`

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset hasła do panelu Spoko Sopot',
      text: `Otrzymaliśmy prośbę o reset hasła do panelu Spoko Sopot.\n\nOtwórz link, aby ustawić nowe hasło: ${resetUrl}\n\nLink jest ważny przez 30 minut i może być użyty tylko raz. Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość.`,
      html: `<p>Otrzymaliśmy prośbę o reset hasła do panelu Spoko Sopot.</p><p><a href="${resetUrl}">Ustaw nowe hasło</a></p><p>Link jest ważny przez 30 minut i może być użyty tylko raz.</p>`,
    })

    return genericResponse()
  } catch (error) {
    console.error('Password reset request failed:', error)
    return NextResponse.json({ message: 'Nie udało się wysłać wiadomości. Spróbuj ponownie później.' }, { status: 500 })
  }
}
