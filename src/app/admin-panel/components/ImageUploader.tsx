'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Input } from '@/app/components/ui/input'
import { getCroppedImg } from '@/utils/getCroppedImg'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'

interface ImageUploaderProps {
  onImageUpload: (currentImage: string) => void
  productTitle: string
  currentImage?: string,
  disabled?: boolean,
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, productTitle, currentImage, disabled }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageToShow, setImageToShow] = useState<string | undefined>(currentImage)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [productName, setProductName] = useState<string>(productTitle || '')

  useEffect(() => {
    if (productName !== productTitle) {
      setProductName(productTitle)
    }
  }, [productTitle, productName])

  useEffect(() => {
    if (imageToShow !== currentImage) {
      setImageToShow(currentImage)
    }
  }, [currentImage, imageToShow])

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
    if (!imageSrc || !croppedAreaPixels || !productName) return
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
        setImageToShow(imageUrl) // Встановлюємо нове зображення
        setImageSrc(null)  // Очищуємо вибране зображення
      } else {
        console.error('Не вдалося завантажити зображення')
      }
    } catch (error) {
      console.error('Помилка під час завантаження зображення', error)
    } finally {
      setUploading(false)
    }
  }



  return (
    <div className="space-y-4">
      {imageToShow && (
        <div className="mb-4">
          <Image
            src={`${imageToShow || '/'}?updated=${new Date().getTime()}`}
            alt="Zdjęcie pozycji menu"
            className="max-w-full h-auto"
            width={150}
            height={150} />
        </div>
      )}

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
            {disabled ? 'Dodaj nazwę produktu, aby dodać zdjęcie' : 'Kliknij, aby dodać zdjęcie'}
          </p>
        </div>
      </div>



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
            Przytnij i zapisz
          </LoadingButton>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
