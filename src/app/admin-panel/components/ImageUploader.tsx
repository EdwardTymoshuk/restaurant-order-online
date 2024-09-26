'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Input } from '@/app/components/ui/input'
import { getCroppedImg } from '@/utils/getCroppedImg'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import React, { useEffect, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
  productTitle: string
  imageUrl?: string // Проп для поточного зображення
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, productTitle, imageUrl }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [productName, setProductName] = useState<string>(productTitle || '')

  useEffect(() => {
    if (productName !== productTitle) {
      setProductName(productTitle)
    }
  }, [productTitle])

  // Оновлюємо imageSrc, якщо змінюється imageUrl
  useEffect(() => {
    if (imageUrl && !imageSrc) {
      setImageSrc(imageUrl)
    }
  }, [imageUrl])

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!imageSrc || !croppedAreaPixels || !productName) return

    const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)

    await handleImageUpload(croppedImageBlob)
  }

  const handleImageUpload = async (imageBlob: Blob) => {
    setUploading(true)

    const formData = new FormData()
    const sanitizedFilename = sanitizeImageFilename(`${productName.trim()}.jpg`)
    formData.append('file', imageBlob, sanitizedFilename)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { imageUrl } = await response.json()
        onImageUpload(imageUrl)
        setImageSrc(imageUrl) // Оновлюємо imageSrc після завантаження
      } else {
        console.error('Nie udało się przesłać obrazu')
      }
    } catch (error) {
      console.error('Nie udało się przesłać obrazu', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      {imageSrc && (
        <div className="crop-container mb-4">
          <div className="relative w-full h-64 bg-gray-100">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <LoadingButton
            variant='secondary'
            isLoading={uploading}
            onClick={handleCrop}
            disabled={uploading}
            className="mt-4"
          >
            {uploading ? 'Przesyłanie...' : 'Przytnij i zapisz'}
          </LoadingButton>
        </div>
      )}

      {/* Якщо зображення завантажене та немає нового зображення для обрізки */}
      {!imageSrc && imageUrl && (
        <div className="mb-4">
          <img src={imageUrl} alt="Obecne zdjęcie" className="max-w-full h-auto" />
        </div>
      )}
    </div>
  )
}

export default ImageUploader
