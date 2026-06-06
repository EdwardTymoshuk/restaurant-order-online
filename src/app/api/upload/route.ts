
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { uploadToR2 } from '@/utils/uploadToR2'
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const runtime = 'nodejs'

const MAX_UPLOAD_SIZE_MB = 50
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
		}

		if (file.size > MAX_UPLOAD_SIZE_BYTES) {
			return NextResponse.json(
				{ error: `Plik jest za duży. Maksymalny rozmiar to ${MAX_UPLOAD_SIZE_MB} MB.` },
				{ status: 413 }
			)
		}

		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		const originalFilename = file.name || 'plik.jpg'
		const sanitizedFilename = sanitizeImageFilename(originalFilename)
		const filenameWithoutExtension =
			sanitizedFilename.replace(/\.[^/.]+$/, '') || `image-${Date.now()}`
		const isImage = file.type.startsWith('image/')
		const isSvg = file.type === 'image/svg+xml'
		const shouldOptimize = isImage && !isSvg

		const outputBuffer = shouldOptimize
			? await sharp(buffer)
					.rotate()
					.resize({
						width: 2000,
						height: 2000,
						fit: 'inside',
						withoutEnlargement: true,
					})
					.webp({ quality: 82, effort: 4 })
					.toBuffer()
			: buffer
		const outputFilename = shouldOptimize
			? `${filenameWithoutExtension}.webp`
			: sanitizedFilename
		const contentType = shouldOptimize
			? 'image/webp'
			: file.type || 'application/octet-stream'

		let imageUrl: string
		const hasR2Config =
			Boolean(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) &&
			Boolean(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) &&
			Boolean(process.env.CLOUDFLARE_R2_PUBLIC_URL)

		if (hasR2Config) {
			imageUrl = await uploadToR2(outputBuffer, outputFilename, contentType)
		} else {
			const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
			await mkdir(uploadsDir, { recursive: true })
			const localFilename = `${Date.now()}-${outputFilename}`
			await writeFile(path.join(uploadsDir, localFilename), outputBuffer)
			imageUrl = `/uploads/${localFilename}`
		}

		return NextResponse.json({ imageUrl })
	} catch (error) {
		console.error('Nie udało się przesłać obrazu do R2', error)
		return NextResponse.json({ error: 'Nie udało się przesłać obrazu' }, { status: 500 })
	}
}
