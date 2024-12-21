// This route handler will be triggered by Vercel Cron according to the schedule defined in vercel.json.
// It checks for orders that have been in the "PENDING" status for more than 10 minutes without being processed.
// If such orders exist, it sends email notifications (in Polish) and marks them as "notified" by setting `notifiedAt`.

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// The GET method is invoked by Vercel Cron on a regular schedule (e.g., every 5 minutes).
export async function GET(request: Request) {
	// Optional security check: verify that the caller is Vercel Cron by matching the CRON_SECRET.
	const authHeader = request.headers.get('Authorization')
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		// If the Authorization header doesn't match, return 401 - Unauthorized.
		return new NextResponse('Unauthorized', { status: 401 })
	}

	try {
		// We'll consider an order "delayed" if its status is PENDING, was updated more than 10 minutes ago,
		// and has not been notified yet (notifiedAt is null).
		const now = new Date()
		const tenMinutesAgo = new Date(now.getTime() - 10 * 1000)

		// Fetch delayed orders from the database that meet the above criteria.
		const delayedOrders = await prisma.order.findMany({
			where: {
				status: 'PENDING',
				statusUpdatedAt: { lte: tenMinutesAgo },
				notifiedAt: null,
			},
		})

		// If there are no delayed orders, respond with a JSON message and exit.
		if (delayedOrders.length === 0) {
			return NextResponse.json({ message: 'Brak opóźnionych zamówień.' })
		}

		// Configure the Nodemailer transporter with your SMTP host and credentials.
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			secure: true, // typically true if using port 465
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})

		// For each delayed order, send an email notification.
		// The email content is in Polish, as requested.
		for (const order of delayedOrders) {
			console.log(`Wysyłanie e-maila o opóźnionym zamówieniu #${order.id}`)

			await transporter.sendMail({
				from: `Spoko Sopot <${process.env.EMAIL_USER}>`,
				to: process.env.RECIPIENT_EMAIL,
				subject: `Niepodjęte zamówienie #${order.id}`,
				text: `Zamówienie #${order.id} nie zostało podjęte już od ponad 10 minut.\nInformacja:\n- Imię: ${order.name}\n- Telefon: ${order.phone}\n- Wartość zamówienia: ${order.finalAmount} PLN`,
			})
		}

		// After sending emails, update the delayed orders in the database, setting `notifiedAt` to the current time.
		// This prevents sending duplicate notifications for the same orders.
		await prisma.order.updateMany({
			where: { id: { in: delayedOrders.map((o) => o.id) } },
			data: { notifiedAt: now },
		})

		// Log the processed orders' IDs to the console.
		console.log(
			`Opóźnione zamówienia zostały przetworzone: ${delayedOrders
				.map((o) => o.id)
				.join(', ')}`
		)

		// Respond with a JSON object indicating success and how many orders were processed.
		return NextResponse.json({
			success: true,
			count: delayedOrders.length,
		})
	} catch (error) {
		// If there's an error during the process, log it and return a 500 - Internal Server Error.
		console.error('Błąd w cron-check-orders:', error)
		return NextResponse.json({ error: 'Wystąpił błąd' }, { status: 500 })
	}
}