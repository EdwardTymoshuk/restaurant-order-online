'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import { Calendar } from '@/app/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Switch } from '@/app/components/ui/switch'
import { cn } from '@/utils/utils'
import { trpc } from '@/utils/trpc'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarDays, Edit3, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface EventFormState {
  id: string
  title: string
  image: string
  description: string
  fullDescription: string
  galleryImages: string[]
  publishedAt: string
  eventStartDate: string
  eventEndDate: string
  isEnded: boolean
}

interface EventItem extends Omit<EventFormState, 'publishedAt' | 'eventStartDate' | 'eventEndDate'> {
  slug?: string | null
  publishedAt?: string | Date | null
  eventStartDate?: string | Date | null
  eventEndDate?: string | Date | null
  createdAt?: string | Date
}

const emptyEvent: EventFormState = {
  id: '',
  title: '',
  image: '',
  description: '',
  fullDescription: '',
  galleryImages: [],
  publishedAt: new Date().toISOString().slice(0, 10),
  eventStartDate: '',
  eventEndDate: '',
  isEnded: false,
}

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Brak daty'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Brak daty'

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const toInputDate = (value?: string | Date | null) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const parseDateField = (value: string): Date | undefined => {
  if (!value) return undefined
  const d = parseISO(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

interface DatePickerFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

const DatePickerField = ({ label, value, onChange }: DatePickerFieldProps) => {
  const selected = parseDateField(value)
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selected && 'text-muted-foreground'
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
            {selected
              ? format(selected, 'd MMMM yyyy', { locale: pl })
              : 'Wybierz datę'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? date.toISOString().slice(0, 10) : '')}
            initialFocus
            locale={pl}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const EventSettings = () => {
  const { data: events = [], refetch, isLoading } = trpc.news.getNews.useQuery()

  const createEvent = trpc.news.createNews.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setIsDialogOpen(false)
      toast.success('Wydarzenie dodane.')
    },
  })

  const updateEvent = trpc.news.updateNews.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setIsDialogOpen(false)
      toast.success('Wydarzenie zapisane.')
    },
  })

  const deleteEvent = trpc.news.deleteNews.useMutation({
    onSuccess: () => {
      refetch()
      toast.success('Wydarzenie usunięte.')
    },
  })

  const [form, setForm] = useState<EventFormState>(emptyEvent)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sortedEvents = useMemo(
    () =>
      [...(events as EventItem[])].sort((a, b) => {
        const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime()
        const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime()
        return bDate - aDate
      }),
    [events]
  )

  const resetForm = () => {
    setForm(emptyEvent)
    setIsEditMode(false)
  }

  const openEditDialog = (event: EventItem) => {
    setForm({
      id: event.id,
      title: event.title,
      image: event.image,
      description: event.description,
      fullDescription: event.fullDescription || '',
      galleryImages: event.galleryImages || [],
      publishedAt: toInputDate(event.publishedAt || event.createdAt),
      eventStartDate: toInputDate(event.eventStartDate),
      eventEndDate: toInputDate(event.eventEndDate),
      isEnded: Boolean(event.isEnded),
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const updateField = <K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleAddOrUpdateEvent = () => {
    if (!form.title.trim() || !form.image || !form.description.trim()) {
      toast.warning('Dodaj tytuł, krótki opis i zdjęcie okładki.')
      return
    }

    const payload = {
      title: form.title.trim(),
      image: form.image,
      description: form.description.trim(),
      fullDescription: form.fullDescription,
      galleryImages: form.galleryImages,
      publishedAt: form.publishedAt || null,
      eventStartDate: form.eventStartDate || null,
      eventEndDate: form.eventEndDate || null,
      isEnded: form.isEnded,
    }

    if (isEditMode) {
      updateEvent.mutate({ id: form.id, ...payload })
      return
    }

    createEvent.mutate(payload)
  }

  const isSaving = createEvent.isLoading || updateEvent.isLoading

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="events" className="border-0">
          <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
            <span className="flex w-full items-center justify-between gap-3 pr-3">
              <span>Zarządzanie wydarzeniami</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {events.length}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Ładowanie wydarzeń...
                </p>
              ) : sortedEvents.length > 0 ? (
                <ul className="space-y-3">
                  {sortedEvents.map((event) => (
                    <li
                      key={event.id}
                      className="grid gap-4 rounded-xl border border-border bg-white p-3 shadow-sm md:grid-cols-[88px_1fr_auto]"
                    >
                      <div className="relative h-20 overflow-hidden rounded-lg bg-muted md:h-full">
                        {event.image ? (
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-950">
                            {event.title}
                          </h3>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase text-slate-500">
                            {event.isEnded ? 'Zakończone' : 'Aktualne'}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-primary" />
                            {formatDate(event.eventStartDate)}
                          </span>
                          <span>Publikacja: {formatDate(event.publishedAt || event.createdAt)}</span>
                          <span>{event.galleryImages?.length || 0} zdjęć</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openEditDialog(event)}
                        >
                          <Edit3 size={15} />
                          Edytuj
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === event.id}
                          onClick={() => {
                            setDeletingId(event.id)
                            deleteEvent.mutate(
                              { id: event.id },
                              { onSettled: () => setDeletingId(null) }
                            )
                          }}
                          aria-label="Usuń wydarzenie"
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Nie ma jeszcze wydarzeń. Dodaj pierwszy wpis widoczny na stronie aktualności.
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
                Dodaj wydarzenie
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
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Tytuł</Label>
                <Input
                  placeholder="Np. Wieczór Walentynkowy w Spoko"
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Krótki opis</Label>
                <Input
                  placeholder="Jedno zdanie widoczne na liście i u góry wpisu"
                  value={form.description}
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                />
              </div>

              <DatePickerField
                label="Data publikacji"
                value={form.publishedAt}
                onChange={(value) => updateField('publishedAt', value)}
              />

              <DatePickerField
                label="Data wydarzenia"
                value={form.eventStartDate}
                onChange={(value) => updateField('eventStartDate', value)}
              />

              <DatePickerField
                label="Data zakończenia"
                value={form.eventEndDate}
                onChange={(value) => updateField('eventEndDate', value)}
              />

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <Label>Zakończone</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Oznaczenie widoczne na stronie aktualności.
                  </p>
                </div>
                <Switch
                  checked={form.isEnded}
                  onCheckedChange={(checked) => updateField('isEnded', checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zdjęcie okładki</Label>
              <ImageUploader
                label="Zdjęcie okładki"
                onImageUpload={(images) => updateField('image', images[0] || '')}
                multiple={false}
                aspectRatio={16 / 9}
                currentImages={form.image ? [form.image] : []}
                uploadPreset="banner"
              />
            </div>

            <div className="space-y-2">
              <Label>Zdjęcia do galerii wpisu</Label>
              <ImageUploader
                label="Galeria wydarzenia"
                onImageUpload={(images) => updateField('galleryImages', images)}
                multiple
                skipCrop
                currentImages={form.galleryImages}
                uploadPreset="gallery"
              />
            </div>

            <div className="space-y-2">
              <Label>Opis szczegółowy</Label>
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <ReactQuill
                  theme="snow"
                  value={form.fullDescription}
                  modules={quillModules}
                  onChange={(value) => updateField('fullDescription', value)}
                  className="min-h-[220px] [&_.ql-container]:min-h-[170px] [&_.ql-container]:border-0 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b"
                />
              </div>
            </div>

            <Button
              onClick={handleAddOrUpdateEvent}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving
                ? 'Zapisywanie...'
                : isEditMode
                  ? 'Zapisz wydarzenie'
                  : 'Dodaj wydarzenie'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default EventSettings
