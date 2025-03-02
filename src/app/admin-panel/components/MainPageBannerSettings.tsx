'use client'

import LoadingButton from '@/app/components/LoadingButton'
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
import { trpc } from '@/utils/trpc'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import ImageUploader from '../components/ImageUploader'

/**
 * Component for managing promotional banners on the main website (spokosopot.pl).
 */
const MainPageBannerSettings = () => {
  // Fetch banners from API
  const {
    data: bannersData = [],
    refetch: refetchBanners,
    isLoading,
  } = trpc.mainPageBanner.getAllMainBanners.useQuery()

  // Mutations for creating and deleting banners
  const createBanner = trpc.mainPageBanner.createMainBanner.useMutation({
    onSuccess: () => {
      refetchBanners()
      resetForm()
      setIsDialogOpen(false) // Close modal after adding
    },
  })
  const deleteBanner = trpc.mainPageBanner.deleteMainBanner.useMutation({
    onSuccess: () => refetchBanners(),
  })

  // State management
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newBanner, setNewBanner] = useState({
    desktopImageUrl: '',
    mobileImageUrl: '',
    linkUrl: '',
  })

  // Reset form function
  const resetForm = () => {
    setNewBanner({
      desktopImageUrl: '',
      mobileImageUrl: '',
      linkUrl: '',
    })
  }

  // Function to handle banner addition
  const handleAddBanner = () => {
    if (!newBanner.desktopImageUrl || !newBanner.mobileImageUrl) {
      toast.warning('Musisz dodać obrazy dla obu wersji (desktop i mobile).')
      return
    }
    createBanner.mutate({
      desktopImageUrl: newBanner.desktopImageUrl,
      mobileImageUrl: newBanner.mobileImageUrl,
      linkUrl: newBanner.linkUrl || '',
      position: 0, // New banners go at the top
    })
  }

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="mainPageBanners">
          <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
            Banery reklamowe (spokosopot.pl)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {isLoading ? (
                <p className="text-gray-500">Ładowanie banerów...</p>
              ) : bannersData.length > 0 ? (
                bannersData.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="flex items-center justify-between gap-4 border p-4 rounded-lg"
                  >
                    {/* Desktop Banner */}
                    <div className="relative w-[40%] h-[150px]">
                      <Image
                        src={banner.desktopImageUrl}
                        width={400}
                        height={150}
                        objectFit="cover"
                        alt={`Baner Desktop-${index + 1}`}
                        className="rounded-md shadow-sm w-full h-full"
                      />
                    </div>

                    {/* Mobile Banner */}
                    <div className="relative w-[40%] h-[450px]">
                      <Image
                        src={banner.mobileImageUrl || ''}
                        width={150}
                        height={150}
                        objectFit="cover"
                        alt={`Baner Mobile-${index + 1}`}
                        className="rounded-md shadow-sm w-full h-full"
                      />
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="danger"
                      disabled={deletingBannerId === banner.id}
                      onClick={() => {
                        setDeletingBannerId(banner.id)
                        deleteBanner.mutate(
                          { id: banner.id },
                          { onSettled: () => setDeletingBannerId(null) }
                        )
                      }}
                      className="w-[15%] min-w-[100px]"
                    >
                      {deletingBannerId === banner.id ? 'Usuwanie...' : 'Usuń'}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 mt-2">
                  Brak banerów. Dodaj nowy baner poniżej.
                </p>
              )}

              {/* Button to open the modal */}
              <Button
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
                className="w-full mt-4"
              >
                Dodaj nowy baner
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Modal for adding banners */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm()
          setIsDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-xl space-y-4 max-h-[90%] overflow-auto">
          <DialogHeader>
            <DialogTitle>Dodaj nowy baner</DialogTitle>
          </DialogHeader>

          {/* Desktop Image */}
          <ImageUploader
            label="Zdjęcie dla wersji desktop (1920x900 px)"
            onImageUpload={(images) =>
              setNewBanner({ ...newBanner, desktopImageUrl: images[0] || '' })
            }
            multiple={false}
            aspectRatio={1920 / 900}
            currentImages={
              newBanner.desktopImageUrl ? [newBanner.desktopImageUrl] : []
            }
          />

          {/* Mobile Image */}
          <ImageUploader
            label="Zdjęcie dla wersji mobilnej (1080x1920 px)"
            onImageUpload={(images) =>
              setNewBanner({ ...newBanner, mobileImageUrl: images[0] || '' })
            }
            multiple={false}
            aspectRatio={1080 / 1920}
            currentImages={
              newBanner.mobileImageUrl ? [newBanner.mobileImageUrl] : []
            }
          />

          {/* Link Input */}
          <input
            type="text"
            placeholder="Opcjonalny link do banera"
            value={newBanner.linkUrl}
            onChange={(e) =>
              setNewBanner({ ...newBanner, linkUrl: e.target.value })
            }
            className="border rounded-md p-2 w-full"
          />

          {/* Add Banner Button */}
          <LoadingButton
            isLoading={createBanner.isLoading}
            onClick={handleAddBanner}
            className="w-full"
          >
            Dodaj baner
          </LoadingButton>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default MainPageBannerSettings
