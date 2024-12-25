// /app/api/orders/notify-pending/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
	const { orderId, phone, finalAmount, name } = await req.json()

	if (!orderId || !phone) {
		return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
	}

	try {
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})

		await transporter.sendMail({
			from: `Spoko Sopot <${process.env.EMAIL_USER}>`,
			to: process.env.RECIPIENT_EMAIL,
			subject: `Niepodjęte zamówienie #${orderId}`,
			text: `Zamówienie #${orderId} nie zostało podjęte już od ponad 10 minut.\n\Informacja:\n- Imie: ${name}\n- Telefon: ${phone}\n- Wartość zamówienia: ${finalAmount} PLN`,
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error sending notification:', error)
		return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
	}
}
