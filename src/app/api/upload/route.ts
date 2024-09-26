import { uploadToR2 } from '@/lib/uploadToR2'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { NextRequest, NextResponse } from 'next/server'

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

		// Завантажуємо до R2
		const imageUrl = await uploadToR2(buffer, sanitizedFilename, contentType)

		return NextResponse.json({ imageUrl })
	} catch (error) {
		console.error('Nie udało się przesłać obrazu do R2', error)
		return NextResponse.json({ error: 'Nie udało się przesłać obrazu' }, { status: 500 })
	}
}
