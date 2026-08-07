
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { uploadToR2 } from '@/utils/uploadToR2'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const runtime = 'nodejs'

const MAX_UPLOAD_SIZE_MB = 50
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
const WEBP_EFFORT = 5

type UploadPreset = 'default' | 'menu' | 'gallery' | 'banner' | 'document'

const uploadPresets: Record<UploadPreset, { maxWidth: number; maxHeight: number; quality: number }> = {
	default: { maxWidth: 2000, maxHeight: 2000, quality: 82 },
	menu: { maxWidth: 1200, maxHeight: 1200, quality: 80 },
	gallery: { maxWidth: 2000, maxHeight: 2000, quality: 82 },
	banner: { maxWidth: 2400, maxHeight: 2400, quality: 82 },
	document: { maxWidth: 2000, maxHeight: 2000, quality: 82 },
}

const parseUploadPreset = (value: FormDataEntryValue | null): UploadPreset => {
	if (typeof value !== 'string') return 'default'
	if (value === 'menu' || value === 'gallery' || value === 'banner' || value === 'document') {
		return value
	}

	return 'default'
}

const createStorageFilename = (filename: string) => {
	const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`
	return `${uniqueSuffix}-${filename}`
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const file = formData.get('file') as File | null
		const preset = parseUploadPreset(formData.get('preset'))

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
		const shouldOptimize = isImage && !isSvg && preset !== 'document'
		const optimizerPreset = uploadPresets[preset]

		const outputBuffer = shouldOptimize
			? await sharp(buffer, { failOn: 'none' })
					.rotate()
					.resize({
						width: optimizerPreset.maxWidth,
						height: optimizerPreset.maxHeight,
						fit: 'inside',
						withoutEnlargement: true,
					})
					.webp({ quality: optimizerPreset.quality, effort: WEBP_EFFORT })
					.toBuffer()
			: buffer
		const outputFilename = shouldOptimize
			? `${filenameWithoutExtension}.webp`
			: sanitizedFilename
		const storageFilename = createStorageFilename(outputFilename)
		const contentType = shouldOptimize
			? 'image/webp'
			: file.type || 'application/octet-stream'
		const outputMetadata = shouldOptimize ? await sharp(outputBuffer).metadata() : null

		let imageUrl: string
		const hasR2Config =
			Boolean(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) &&
			Boolean(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) &&
			Boolean(process.env.CLOUDFLARE_R2_PUBLIC_URL)

		if (hasR2Config) {
			imageUrl = await uploadToR2(outputBuffer, storageFilename, contentType)
		} else {
			const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
			await mkdir(uploadsDir, { recursive: true })
			await writeFile(path.join(uploadsDir, storageFilename), outputBuffer)
			imageUrl = `/uploads/${storageFilename}`
		}

		return NextResponse.json({
			imageUrl,
			optimized: shouldOptimize,
			preset,
			originalSize: file.size,
			outputSize: outputBuffer.byteLength,
			width: outputMetadata?.width,
			height: outputMetadata?.height,
			format: shouldOptimize ? 'webp' : outputMetadata?.format,
		})
	} catch (error) {
		console.error('Nie udało się przesłać obrazu do R2', error)
		return NextResponse.json({ error: 'Nie udało się przesłać obrazu' }, { status: 500 })
	}
}
