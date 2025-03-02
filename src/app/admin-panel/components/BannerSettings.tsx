'use client'

import LoadingButton from '@/app/components/LoadingButton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { trpc } from '@/utils/trpc'
import Image from 'next/image'
import { useState } from 'react'
import ImageUploader from '../components/ImageUploader'

/**
 * Component for managing promotional banners.
 */
const BannerSettings = () => {
  // Fetch banners data from the API
  const { data: bannersData, refetch: refetchBanners } =
    trpc.banner.getAllBanners.useQuery()
  const createBanner = trpc.banner.createBanner.useMutation({
    onSuccess: () => refetchBanners(),
  })
  const deleteBanner = trpc.banner.deleteBanner.useMutation({
    onSuccess: () => refetchBanners(),
  })
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null)

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="banners">
          <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
            Banery reklamowe (order.spokosopot.pl)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {bannersData && bannersData.length > 0 ? (
                bannersData.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="flex items-center justify-between space-x-4 max-w-lg"
                  >
                    <Image
                      src={banner.imageUrl}
                      width={400}
                      height={100}
                      alt={`Baner-${index + 1}`}
                      className="w-full h-auto object-cover rounded-md shadow-sm"
                    />
                    <LoadingButton
                      isLoading={deletingBannerId === banner.id}
                      variant="danger"
                      size="sm"
                      onClick={() => deleteBanner.mutate({ id: banner.id })}
                      className="ml-4"
                    >
                      Usuń
                    </LoadingButton>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 mt-2">
                  Brak banerów. Dodaj nowy baner poniżej.
                </p>
              )}
              <ImageUploader
                label=""
                onImageUpload={(images) =>
                  createBanner.mutate({
                    imageUrl: images[0],
                    linkUrl: '',
                    position: bannersData ? bannersData.length + 1 : 1,
                  })
                }
                multiple={false}
                aspectRatio={1056 / 384}
                currentImages={[]}
              />
              <p className="text-text-foreground italic">
                *Zalecany rozmiar banera - to{' '}
                <span className="text-text-secondary">1056 px x 384 px</span>
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}

export default BannerSettings
