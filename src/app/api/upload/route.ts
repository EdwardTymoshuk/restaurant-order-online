
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { uploadToR2 } from '@/utils/uploadToR2'
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
		}

		// Читаємо вміст файлу як Buffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Отримуємо назву файлу та тип контенту
		const originalFilename = file.name || 'plik.jpg'
		const sanitizedFilename = sanitizeImageFilename(originalFilename)
		const contentType = file.type || 'application/octet-stream'

		let imageUrl: string
		const hasR2Config =
			Boolean(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) &&
			Boolean(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) &&
			Boolean(process.env.CLOUDFLARE_R2_PUBLIC_URL)

		if (hasR2Config) {
			imageUrl = await uploadToR2(buffer, sanitizedFilename, contentType)
		} else {
			const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
			await mkdir(uploadsDir, { recursive: true })
			const localFilename = `${Date.now()}-${sanitizedFilename}`
			await writeFile(path.join(uploadsDir, localFilename), buffer)
			imageUrl = `/uploads/${localFilename}`
		}

		return NextResponse.json({ imageUrl })
	} catch (error) {
		console.error('Nie udało się przesłać obrazu do R2', error)
		return NextResponse.json({ error: 'Nie udało się przesłać obrazu' }, { status: 500 })
	}
}
