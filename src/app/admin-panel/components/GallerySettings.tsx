'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { trpc } from '@/utils/trpc'
import { Edit3, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

const galleryCategories = [
  { value: 'dishes', label: 'Dania' },
  { value: 'terrace', label: 'Taras i widok' },
  { value: 'interior', label: 'Wnętrze' },
  { value: 'events', label: 'Przyjęcia' },
  { value: 'details', label: 'Detale' },
] as const

type GalleryCategory = (typeof galleryCategories)[number]['value']

interface GalleryImageForm {
  id: string
  title: string
  alt: string
  src: string
  thumbnail: string
  category: GalleryCategory
  sortOrder: number
  isFeatured: boolean
  isActive: boolean
}

interface GalleryImageItem extends GalleryImageForm {
  createdAt?: string | Date
}

const emptyImage: GalleryImageForm = {
  id: '',
  title: '',
  alt: '',
  src: '',
  thumbnail: '',
  category: 'dishes',
  sortOrder: 0,
  isFeatured: false,
  isActive: true,
}

const getCategoryLabel = (category: string) =>
  galleryCategories.find((item) => item.value === category)?.label || 'Detale'

const GallerySettings = () => {
  const { data: images = [], refetch, isLoading } =
    trpc.gallery.getGalleryImages.useQuery()

  const createImage = trpc.gallery.createGalleryImage.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setIsDialogOpen(false)
      toast.success('Zdjęcie dodane do galerii.')
    },
  })

  const updateImage = trpc.gallery.updateGalleryImage.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setIsDialogOpen(false)
      toast.success('Zdjęcie zapisane.')
    },
  })

  const deleteImage = trpc.gallery.deleteGalleryImage.useMutation({
    onSuccess: () => {
      refetch()
      toast.success('Zdjęcie usunięte z galerii.')
    },
  })

  const [form, setForm] = useState<GalleryImageForm>(emptyImage)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const groupedImages = useMemo(() => {
    return galleryCategories.map((category) => ({
      ...category,
      images: (images as GalleryImageItem[]).filter(
        (image) => image.category === category.value
      ),
    }))
  }, [images])

  const resetForm = () => {
    setForm(emptyImage)
    setIsEditMode(false)
  }

  const openEditDialog = (image: GalleryImageItem) => {
    setForm({
      id: image.id,
      title: image.title,
      alt: image.alt || '',
      src: image.src,
      thumbnail: image.thumbnail || image.src,
      category: image.category,
      sortOrder: image.sortOrder || 0,
      isFeatured: Boolean(image.isFeatured),
      isActive: Boolean(image.isActive),
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const updateField = <K extends keyof GalleryImageForm>(
    key: K,
    value: GalleryImageForm[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.src) {
      toast.warning('Dodaj nazwę i zdjęcie.')
      return
    }

    const payload = {
      title: form.title.trim(),
      alt: form.alt.trim() || form.title.trim(),
      src: form.src,
      thumbnail: form.thumbnail || form.src,
      category: form.category,
      sortOrder: Number(form.sortOrder) || 0,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    }

    if (isEditMode) {
      updateImage.mutate({ id: form.id, ...payload })
      return
    }

    createImage.mutate(payload)
  }

  const isSaving = createImage.isLoading || updateImage.isLoading

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="gallery" className="border-0">
          <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
            <span className="flex w-full items-center justify-between gap-3 pr-3">
              <span>Galeria strony</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {images.length}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Ładowanie zdjęć...
                </p>
              ) : images.length > 0 ? (
                <div className="space-y-5">
                  {groupedImages.map((group) =>
                    group.images.length > 0 ? (
                      <div key={group.value} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {group.label}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {group.images.length} zdjęć
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {group.images.map((image) => (
                            <article
                              key={image.id}
                              className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                            >
                              <div className="relative aspect-[4/3] bg-muted">
                                {image.src ? (
                                  <Image
                                    src={image.src}
                                    alt={image.alt || image.title}
                                    fill
                                    sizes="320px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-muted-foreground">
                                    <ImageIcon size={22} />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3 p-3">
                                <div>
                                  <h4 className="line-clamp-1 text-sm font-semibold text-slate-950">
                                    {image.title}
                                  </h4>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {getCategoryLabel(image.category)} · kolejność {image.sortOrder}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-slate-600">
                                    {image.isActive ? 'Widoczne' : 'Ukryte'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(image)}
                                      aria-label="Edytuj zdjęcie"
                                    >
                                      <Edit3 size={15} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={deletingId === image.id}
                                      onClick={() => {
                                        setDeletingId(image.id)
                                        deleteImage.mutate(
                                          { id: image.id },
                                          { onSettled: () => setDeletingId(null) }
                                        )
                                      }}
                                      aria-label="Usuń zdjęcie"
                                      className="text-danger hover:bg-danger/10 hover:text-danger"
                                    >
                                      <Trash2 size={15} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Nie ma jeszcze zdjęć galerii. Dodaj zdjęcia, które mają pojawić się na stronie restauracji.
                </p>
              )}

              <Button
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
                className="w-full gap-2"
              >
                <Plus size={16} />
                Dodaj zdjęcie do galerii
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm()
          setIsDialogOpen(open)
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edytuj zdjęcie galerii' : 'Dodaj zdjęcie galerii'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nazwa zdjęcia</Label>
                <Input
                  placeholder="Np. Taras z widokiem na morze"
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    updateField('category', value as GalleryCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {galleryCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tekst alternatywny</Label>
                <Input
                  placeholder="Opis zdjęcia dla SEO i dostępności"
                  value={form.alt}
                  onChange={(event) => updateField('alt', event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Kolejność</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField('sortOrder', Number(event.target.value))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <Label>Widoczne na stronie</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ukryte zdjęcia zostają w panelu, ale nie pokazują się gościom.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => updateField('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <Label>Wyróżnione</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Przydatne do mocniejszego pokazania zdjęcia na stronie.
                  </p>
                </div>
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(checked) =>
                    updateField('isFeatured', checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zdjęcie</Label>
              <ImageUploader
                label="Zdjęcie galerii"
                onImageUpload={(images) => {
                  const nextImage = images[0] || ''
                  updateField('src', nextImage)
                  updateField('thumbnail', nextImage)
                }}
                multiple={false}
                skipCrop
                currentImages={form.src ? [form.src] : []}
                uploadPreset="gallery"
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving
                ? 'Zapisywanie...'
                : isEditMode
                  ? 'Zapisz zdjęcie'
                  : 'Dodaj zdjęcie'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default GallerySettings
