'use client'

import LoadingButton from '@/app/components/LoadingButton'
import { Button } from '@/app/components/ui/button'
import { getCroppedImg } from '@/utils/getCroppedImg'
import { cn } from '@/utils/utils'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { ImagePlus, Trash2, UploadCloud, X } from 'lucide-react'
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
  const [selectedImages, setSelectedImages] = useState<string[]>(currentImages.filter(Boolean))
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedImages(currentImages.filter(Boolean))
  }, [currentImages])

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const readImageFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    readImageFile(Array.from(e.target.files || [])[0])
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
    readImageFile(Array.from(e.dataTransfer.files || [])[0])
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
        const updatedImages = multiple ? [...selectedImages, imageUrl] : [imageUrl]
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
    <div className="space-y-3">
      <input
        id={uniqueId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        multiple={multiple}
        className="hidden"
      />

      {selectedImages.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          {selectedImages.map((img, index) => (
            <div key={img} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={img}
                alt={`${label} ${index + 1}`}
                fill
                sizes="180px"
                className="object-cover"
              />
              <button
                type="button"
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-danger"
                onClick={() => handleRemoveLocalImage(index)}
                aria-label="Usuń zdjęcie"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <label
            htmlFor={uniqueId}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center transition',
              isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary/60 hover:bg-primary/5'
            )}
          >
            <ImagePlus className="mb-3 h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-slate-700">
              {multiple ? 'Dodaj kolejne zdjęcie' : 'Zmień zdjęcie'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Kliknij albo przeciągnij plik tutaj.
            </p>
          </label>
        </div>
      ) : (
        <label
          htmlFor={uniqueId}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center transition',
            isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary/60 hover:bg-primary/5'
          )}
        >
          <UploadCloud className="mb-3 h-9 w-9 text-primary" />
          <p className="text-sm font-medium text-slate-800">
            Kliknij, aby dodać zdjęcie albo przeciągnij je tutaj
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Zdjęcie przytniemy do właściwych proporcji przed zapisem.
          </p>
        </label>
      )}

      {imageSrc && (
        <div className="rounded-xl border border-border bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Kadrowanie zdjęcia</p>
              <p className="text-xs text-muted-foreground">Ustaw kadr i zapisz podgląd produktu.</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setImageSrc(null)}
              aria-label="Zamknij kadrowanie"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-slate-950">
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
          <div className="mt-3 flex justify-end">
            <LoadingButton
              variant="default"
              isLoading={uploading}
              onClick={handleCrop}
              disabled={uploading}
            >
              Przytnij i zapisz zdjęcie
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
