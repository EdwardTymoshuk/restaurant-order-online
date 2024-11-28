'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Input } from '@/app/components/ui/input'
import { getCroppedImg } from '@/utils/getCroppedImg'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import React, { useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'

interface BannerUploaderProps {
	onImageUpload: (currentImage: string) => void
	currentImage?: string
	disabled?: boolean
}

const BannerUploader: React.FC<BannerUploaderProps> = ({ onImageUpload, currentImage, disabled }) => {
	const [imageSrc, setImageSrc] = useState<string | null>(null)
	const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
	const [zoom, setZoom] = useState<number>(1)
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
	const [uploading, setUploading] = useState<boolean>(false)

	const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels)
	}

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = () => {
				setImageSrc(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleCrop = async () => {
		if (!imageSrc || !croppedAreaPixels) return
		try {
			const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
			await handleImageUpload(croppedImageBlob)
		} catch (error) {
			console.error("Error during cropping:", error)
		}
	}

	const handleImageUpload = async (imageBlob: Blob) => {
		setUploading(true)

		const formData = new FormData()
		const sanitizedFilename = sanitizeImageFilename(`banner-${Date.now()}.jpg`)
		formData.append('file', imageBlob, sanitizedFilename)

		try {
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})

			if (response.ok) {
				const { imageUrl } = await response.json()
				onImageUpload(imageUrl)
				setImageSrc(null)
			} else {
				console.error('Failed to upload image')
			}
		} catch (error) {
			console.error('Error during image upload:', error)
		} finally {
			setUploading(false)
		}
	}

	return (
		<div className="space-y-4">
			<div className="relative">
				<Input
					type="file"
					accept="image/*"
					onChange={handleImageChange}
					className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${disabled ? 'hidden' : ''}`}
					disabled={disabled}
				/>
				<div
					className={`h-24 flex items-center justify-center w-full border border-dashed border-gray-400 ${disabled ? 'bg-gray-200 cursor-not-allowed' : ''}`}
				>
					<p className="text-gray-400">
						{disabled ? 'Przesyłanie jest wyłączone' : 'Kliknij lub przesuń tu baner reklamowy'}
					</p>
				</div>
			</div>

			{imageSrc && (
				<div className="crop-container mb-4">
					<div className="relative w-full h-96 bg-gray-100">
						<Cropper
							image={imageSrc}
							crop={crop}
							zoom={zoom}
							aspect={1056 / 384} // Aspect ratio for the banner
							onCropChange={setCrop}
							onZoomChange={setZoom}
							onCropComplete={onCropComplete}
						/>
					</div>
					<LoadingButton
						variant="default"
						isLoading={uploading}
						onClick={handleCrop}
						disabled={uploading}
						className="mt-4"
					>
						Zapisz
					</LoadingButton>
				</div>
			)}
		</div>
	)
}

export default BannerUploader
