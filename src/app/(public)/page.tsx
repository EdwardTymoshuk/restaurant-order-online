'use client'

import DeliveryForm from '@/app/components/DeliveryForm'
import LoadingButton from '@/app/components/LoadingButton'
import PageSubHeader from '@/app/components/PageSubHeader'
import RestaurantMap from '@/app/components/RestaurantMap'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { DELIVERY_RADIUS_METERS, RESTAURANT_COORDINATES } from '@/config/constants'
import { Coordinates } from '@/utils/deliveryUtils'
import { LoadScriptNext } from "@react-google-maps/api"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from "react"
import { MdOutlineDeliveryDining, MdOutlineKeyboardArrowRight, MdOutlineRestaurantMenu } from "react-icons/md"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('delivery')
  const [formData, setFormData] = useState({ address: '' })
  const [addressVerified, setAddressVerified] = useState(false)
  const [addressCoordinates, setAddressCoordinates] = useState<Coordinates | null>(null)

  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const libraries: ("places")[] = ["places"]

  const handleOrderClick = () => {
    startTransition(() => {
      router.push('/order')
    })
  }

  useEffect(() => {
    // Ефект для симуляції завершення початкового завантаження
    setTimeout(() => setLoading(false), 1000) // Наприклад, через 1 секунду
  }, [])

  return (
    <div className='my-auto w-full py-8'>
      <div className="relative w-full h-64 overflow-hidden">
        {loading ? (
          <Skeleton className="w-full h-64" />
        ) : (
          <Image
            src="/img/carousel-1.jpg"
            alt="image"
            fill
            style={{ objectFit: 'cover' }}
            className="absolute inset-0"
          />
        )}
      </div>

      <LoadScriptNext
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        libraries={libraries}
        loadingElement={
          <div className='flex gap-2'>
            <div className="space-y-4">
              <Skeleton className="w-full h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="w-full h-64" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          </div>
        }
      >
        <div className="flex flex-col-reverse md:flex-row md:space-x-8 my-8 mx-auto w-full min-h-96 px-8 relative z-0">
          <div className="w-full md:w-1/2 h-96 my-auto">
            {loading ? (
              <Skeleton className="w-full h-96" />
            ) : (
              <RestaurantMap
                center={RESTAURANT_COORDINATES}
                zoom={11.3}
                markers={[RESTAURANT_COORDINATES].filter(Boolean) as Coordinates[]}
                circleRadius={DELIVERY_RADIUS_METERS}
                circleOptions={{
                  fillColor: "#ABD95A",
                  fillOpacity: 0.2,
                  strokeColor: "#ABD95A",
                  strokeOpacity: 0.2,
                  strokeWeight: 1,
                }}
              />
            )}
          </div>
          <div className="w-full md:w-1/2">
            <Tabs defaultValue="delivery" onValueChange={setActiveTab}>
              <TabsList className='p-2 h-fit flex flex-row justify-around bg-transparent relative'>
                <TabsTrigger
                  className='flex flex-col items-center text-lg md:text-2xl data-[state=active]:text-secondary data-[state=active]:shadow-none rounded-none relative z-10'
                  value="delivery"
                >
                  <MdOutlineDeliveryDining className='text-4xl' />
                  <span className="relative">DOSTAWA</span>
                </TabsTrigger>
                <TabsTrigger
                  className='flex flex-col items-center text-lg md:text-2xl data-[state=active]:text-secondary data-[state=active]:shadow-none rounded-none relative z-10'
                  value="take-out"
                >
                  <MdOutlineRestaurantMenu className='text-4xl' />
                  <span className="relative">ODBIÓR</span>
                </TabsTrigger>
                <span
                  className='absolute bottom-0 left-0 h-[2px] bg-secondary transition-all duration-300 ease-out'
                  style={{
                    width: '25%',
                    transform: activeTab === 'delivery' ? 'translateX(60%)' : 'translateX(250%)',
                  }}
                />
              </TabsList>
              <TabsContent value="delivery">
                <PageSubHeader title='Sprawdź czy dowozimy do Ciebie' className='text-2xl' />
                {loading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <div className='flex flex-col mb-8'>

                    <DeliveryForm
                      formData={formData}
                      onFormDataChange={setFormData}
                      addressVerified={addressVerified}
                      setAddressVerified={setAddressVerified}
                    />
                    <LoadingButton
                      isLoading={isPending}
                      type="button"
                      variant="secondary"
                      // className="w-full border border-secondary text-secondary hover:bg-secondary/80 hover:text-text-primary transition-all"
                      className="w-full"
                      onClick={handleOrderClick}
                    >
                      Do zamówienia <MdOutlineKeyboardArrowRight />
                    </LoadingButton>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="take-out">
                <PageSubHeader title='Zamów online, odbierz w restauracji' className='text-2xl' />
                {loading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <div className='space-y-4 mb-8'>
                    <div className='flex flex-col text-lg text-center text-text-secondary'>
                      <span className='text-secondary'>Hestii 3, Sopot</span>
                      <span>Pn-Pt: 12:00 - 22:00</span>
                      <span>Sb-Nd 8:00 - 22:00</span>
                    </div>
                    <LoadingButton
                      isLoading={isPending}
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleOrderClick}
                    >
                      Do zamówienia <MdOutlineKeyboardArrowRight />
                    </LoadingButton>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </LoadScriptNext>
    </div>
  )
}
