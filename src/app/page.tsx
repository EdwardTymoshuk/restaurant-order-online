'use client'

import DeliveryForm from '@/components/DeliveryForm'
import LoadingButton from '@/components/LoadingButton'
import PageSubHeader from '@/components/PageSubHeader'
import RestaurantMap from '@/components/RestaurantMap'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CLOSING_HOUR, DELIVERY_RADIUS_METERS, MINIMUM_WAIT_TIME_MINUTES, OPENING_HOUR, OPENING_MINUTES_DELAY, RESTAURANT_COORDINATES } from '@/constants'
import { Coordinates } from '@/lib/utils'
import { LoadScriptNext } from "@react-google-maps/api"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { MdOutlineDeliveryDining, MdOutlineKeyboardArrowRight, MdOutlineRestaurantMenu } from "react-icons/md"
import { LineWave } from 'react-loader-spinner'

export default function Home() {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('delivery')
  const [formData, setFormData] = useState({ address: '' }) // State for form data
  const [addressVerified, setAddressVerified] = useState(false) // State for address verification

  const router = useRouter()

  const libraries: ("places")[] = ["places"]

  useEffect(() => {
    const nearestTime = getNearestHour()
    setSelectedTime(nearestTime)
  }, [])

  const handleTimeChange = (date: Date | null) => {
    if (date) {
      setSelectedTime(date)
    }
  }

  const getNearestHour = (): Date => {
    const now = new Date()
    let nearestAvailableTime: Date

    if (
      now.getHours() >= CLOSING_HOUR ||
      now.getHours() < OPENING_HOUR ||
      (now.getHours() === OPENING_HOUR && now.getMinutes() < OPENING_MINUTES_DELAY)
    ) {
      nearestAvailableTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        OPENING_HOUR,
        OPENING_MINUTES_DELAY + MINIMUM_WAIT_TIME_MINUTES,
        0,
        0
      )
      if (now.getHours() >= CLOSING_HOUR) {
        nearestAvailableTime.setDate(now.getDate() + 1)
      }
    } else {
      nearestAvailableTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        Math.ceil(now.getMinutes() / 30) * 30 + MINIMUM_WAIT_TIME_MINUTES,
        0,
        0
      )
    }

    return nearestAvailableTime
  }

  const filterTime = (time: Date) => {
    const now = new Date()
    const nearestAvailableTime = getNearestHour()
    const selectedDate = new Date(selectedTime ?? now)
    const hour = time.getHours()
    const minutes = time.getMinutes()

    if (
      selectedDate.toDateString() === now.toDateString() &&
      (hour < nearestAvailableTime.getHours() ||
        (hour === nearestAvailableTime.getHours() &&
          minutes < nearestAvailableTime.getMinutes()))
    ) {
      return false
    }

    if (hour < OPENING_HOUR || hour >= CLOSING_HOUR) {
      return false
    }
    if (hour === OPENING_HOUR && minutes < OPENING_MINUTES_DELAY) {
      return false
    }
    return true
  }

  const handleOrderClick = async () => {
    setLoading(true)
    try {
      router.push('/order')
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Navigation error:", error)
      setLoading(false)
    }
  }

  return (
    <div className='my-auto w-full'>
      <LoadScriptNext
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        libraries={libraries}
        loadingElement={
          <div className="flex justify-center items-center h-full">
            <LineWave
              height="100"
              width="100"
              color="#ABD95A"
              ariaLabel="line-wave"
              visible={true}
            />
          </div>
        }
      >
        <div className="flex flex-col-reverse md:flex-row space-y-8 md:space-x-8 my-8 mx-auto w-full min-h-96 px-8 relative z-0">
          <div className="w-full md:w-1/2 h-96 my-auto">
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
          </div>
          <div className="w-full md:w-1/2">
            <Tabs defaultValue="delivery" onValueChange={setActiveTab}>
              <TabsList className='p-2 h-fit flex flex-row justify-around bg-transparent relative'>
                <TabsTrigger
                  className='flex flex-col items-center text-lg md:text-2xl data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none relative z-10'
                  value="delivery"
                >
                  <MdOutlineDeliveryDining className='text-4xl' />
                  <span className="relative">DOSTAWA</span>
                </TabsTrigger>
                <TabsTrigger
                  className='flex flex-col items-center text-lg md:text-2xl data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none relative z-10'
                  value="take-out"
                >
                  <MdOutlineRestaurantMenu className='text-4xl' />
                  <span className="relative">ODBIÓR</span>
                </TabsTrigger>
                <span
                  className='absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300 ease-out'
                  style={{
                    width: '25%',
                    transform: activeTab === 'delivery' ? 'translateX(60%)' : 'translateX(250%)',
                  }}
                />
              </TabsList>
              <TabsContent value="delivery">
                <PageSubHeader title='Sprawdź czy dowozimy do Ciebie' className='text-2xl' />
                <DeliveryForm
                  formData={formData}
                  onFormDataChange={setFormData}
                  addressVerified={addressVerified}
                  setAddressVerified={setAddressVerified}
                />
              </TabsContent>
              <TabsContent value="take-out">
                <PageSubHeader title='Zamów online, odbierz w restauracji' className='text-2xl' />
                <div className='space-y-4 mb-8'>
                  <div className='flex flex-col text-lg text-center text-text-foreground'>
                    <span className='text-primary'>Hestii 3, Sopot</span>
                    <span>Pn-Pt: 12:00 - 22:00</span>
                    <span>Sb-Nd 8:00 - 22:00</span>
                  </div>
                  <LoadingButton
                    isLoading={loading}
                    type="button"
                    className="w-full"
                    onClick={handleOrderClick}
                  >
                    Do zamówienia <MdOutlineKeyboardArrowRight />
                  </LoadingButton>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </LoadScriptNext>
    </div>
  )
}
