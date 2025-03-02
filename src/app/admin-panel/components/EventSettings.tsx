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
import { trpc } from '@/utils/trpc'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { toast } from 'sonner'
import ImageUploader from './ImageUploader'

// Dynamic import for the rich text editor (SSR disabled)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface Event {
  id: string
  title: string
  image: string
  description: string
  fullDescription: string
  galleryImages: string[]
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean'],
  ],
}

const EventSettings = () => {
  const { data: events = [], refetch } = trpc.news.getNews.useQuery()
  const createEvent = trpc.news.createNews.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setIsDialogOpen(false) // Zamknięcie dialogu po dodaniu
    },
  })
  const updateEvent = trpc.news.updateNews.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setIsDialogOpen(false) // Zamknięcie dialogu po edycji
    },
  })
  const deleteEvent = trpc.news.deleteNews.useMutation({
    onSuccess: () => refetch(),
  })

  const [newEvent, setNewEvent] = useState<Event>({
    id: '',
    title: '',
    image: '',
    description: '',
    fullDescription: '',
    galleryImages: [],
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [galleryAspectRatio, setGalleryAspectRatio] = useState<
    number | undefined
  >(undefined)

  const resetForm = () => {
    setNewEvent({
      id: '',
      title: '',
      image: '',
      description: '',
      fullDescription: '',
      galleryImages: [],
    })
    setIsEditMode(false)
  }

  const handleAddOrUpdateEvent = () => {
    if (!newEvent.title || !newEvent.image || !newEvent.description) {
      toast.warning('Wszystkie pola muszą być wypełnione.')
      return
    }

    if (isEditMode) {
      updateEvent.mutate({
        id: newEvent.id,
        title: newEvent.title,
        image: newEvent.image,
        description: newEvent.description,
        fullDescription: newEvent.fullDescription,
        galleryImages: newEvent.galleryImages,
      })
    } else {
      createEvent.mutate({
        title: newEvent.title,
        image: newEvent.image,
        description: newEvent.description,
        fullDescription: newEvent.fullDescription,
        galleryImages: newEvent.galleryImages,
      })
    }
  }

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="events">
          <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
            Zarządzanie wydarzeniami
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {events.length > 0 ? (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
                    >
                      <h3 className="text-lg font-semibold text-secondary">
                        {event.title}
                      </h3>
                      <div className="space-x-2">
                        <Button
                          variant="success"
                          onClick={() => {
                            setNewEvent(event)
                            setIsEditMode(true)
                            setIsDialogOpen(true)
                          }}
                        >
                          Edytuj
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => deleteEvent.mutate({ id: event.id })}
                        >
                          Usuń
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Brak wydarzeń</p>
              )}

              <Button
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
                className="w-full"
              >
                Dodaj nowe wydarzenie
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm() // Resetuj formularz przy zamykaniu
          setIsDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-xl space-y-4 max-h-[90%] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Tytuł wydarzenia"
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent({ ...newEvent, title: e.target.value })
            }
          />
          <Input
            placeholder="Krótki opis wydarzenia"
            value={newEvent.description}
            onChange={(e) =>
              setNewEvent({ ...newEvent, description: e.target.value })
            }
          />

          <ImageUploader
            label="Zdjęcie okładki (380x250 px)"
            onImageUpload={(images) =>
              setNewEvent({ ...newEvent, image: images[0] || '' })
            }
            multiple={false}
            aspectRatio={380 / 250}
            currentImages={newEvent.image ? [newEvent.image] : []}
          />

          <div className="flex items-center space-x-4">
            <span className="font-medium">Proporcje zdjęć galerii:</span>
            <select
              className="border rounded-md p-1"
              onChange={(e) =>
                setGalleryAspectRatio(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            >
              <option value="">Dowolne</option>
              <option value="0.700">9:16 (mobilny)</option>
              <option value="1">1:1 (kwadrat)</option>
            </select>
          </div>

          <ImageUploader
            label="Zdjęcia galerii"
            onImageUpload={(images) =>
              setNewEvent((prev) => ({
                ...prev,
                galleryImages: images,
              }))
            }
            multiple
            aspectRatio={galleryAspectRatio}
            currentImages={newEvent.galleryImages}
          />

          <ReactQuill
            theme="snow"
            value={newEvent.fullDescription}
            modules={quillModules}
            onChange={(value) =>
              setNewEvent({ ...newEvent, fullDescription: value })
            }
            className="h-40 pb-8"
          />

          <Button onClick={handleAddOrUpdateEvent} className="w-full">
            {isEditMode ? 'Zapisz zmiany' : 'Dodaj wydarzenie'}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default EventSettings
