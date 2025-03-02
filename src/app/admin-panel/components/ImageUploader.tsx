'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { getCroppedImg } from '@/utils/getCroppedImg'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'

interface ImageUploaderProps {
  label: string
  onImageUpload: (imageUrls: string[]) => void
  multiple?: boolean
  aspectRatio?: number
  currentImages?: string[]
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  onImageUpload,
  multiple = false,
  aspectRatio = 1,
  currentImages = [],
}) => {
  const uniqueId = useId()

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>(currentImages)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedImages(currentImages)
  }, [currentImages])

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(files[0]) // only first file is read/cropped
    }
  }

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      await handleImageUpload(croppedImageBlob)
    } catch (error) {
      console.error('Błąd podczas kadrowania:', error)
    }
  }

  const handleImageUpload = async (imageBlob: Blob) => {
    setUploading(true)

    const formData = new FormData()
    const sanitizedFilename = sanitizeImageFilename(`image-${Date.now()}.jpg`)
    formData.append('file', imageBlob, sanitizedFilename)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { imageUrl } = await response.json()
        const updatedImages = [...selectedImages, imageUrl]
        setSelectedImages(updatedImages)
        onImageUpload(updatedImages)
        setImageSrc(null)

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        console.error('Błąd przesyłania zdjęcia')
      }
    } catch (error) {
      console.error('Błąd podczas przesyłania:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLocalImage = (index: number) => {
    const updated = selectedImages.filter((_, i) => i !== index)
    setSelectedImages(updated)
    onImageUpload(updated)
  }

  return (
    <div className="space-y-4">
      <p className="font-semibold">{label}</p>

      {/* Display existing images */}
      <div className="flex gap-2 flex-wrap">
        {selectedImages.map((img, index) => (
          <div key={index} className="relative">
            <Image
              src={img}
              alt={`Uploaded image ${index}`}
              width={150}
              height={150}
              className="rounded-md border border-gray-300 object-cover"
            />
            <button
              className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full"
              onClick={() => handleRemoveLocalImage(index)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        id={uniqueId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        multiple={multiple}
        className="hidden"
      />

      {/* Label triggers the file input */}
      <label
        htmlFor={uniqueId}
        className="flex items-center justify-center w-full h-24 border border-dashed border-gray-400 p-4 cursor-pointer text-gray-500 hover:bg-gray-100"
      >
        Kliknij, aby dodać zdjęcie lub przenieś je tutaj
      </label>

      {/* Crop UI if there's an image to crop */}
      {imageSrc && (
        <div className="crop-container mb-4">
          <div className="relative w-full h-64 bg-gray-100 rounded-md p-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              classes={{
                containerClassName: 'w-full h-full relative',
                mediaClassName: 'max-w-full h-auto',
              }}
            />
          </div>
          <LoadingButton
            variant="default"
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
