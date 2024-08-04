'use client'

import DeliveryForm from '@/components/DeliveryForm'
import LoadingButton from '@/components/LoadingButton'
import PageSubHeader from '@/components/PageSubHeader'
import RestaurantMap from '@/components/RestaurantMap'
import { TimeSelector } from '@/components/TimeSelector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CLOSING_HOUR, MINIMUM_WAIT_TIME_MINUTES, OPENING_HOUR, OPENING_MINUTES_DELAY, RESTAURANT_COORDINATES } from '@/constants'
import { useEffect, useState } from "react"
import { MdOutlineDeliveryDining, MdOutlineKeyboardArrowRight, MdOutlineRestaurantMenu } from "react-icons/md"

export default function Home() {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

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

    // Переконатися, що вибраний час знаходиться в межах сьогоднішнього дня і не в минулому
    if (
      selectedDate.toDateString() === now.toDateString() &&
      (hour < nearestAvailableTime.getHours() ||
        (hour === nearestAvailableTime.getHours() &&
          minutes < nearestAvailableTime.getMinutes()))
    ) {
      return false
    }

    // Переконатися, що вибраний час знаходиться в межах робочих годин
    if (hour < OPENING_HOUR || hour >= CLOSING_HOUR) {
      return false
    }
    if (hour === OPENING_HOUR && minutes < OPENING_MINUTES_DELAY) {
      return false
    }
    return true
  }

  const handleOrder = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert('Замовлення прийнято!')
    }, 2000)
  }

  return (
    <Tabs defaultValue="delivery" className="my-8 mx-auto w-full px-8">
      <TabsList className='p-2 h-fit flex flex-row justify-around bg-transparent'>
        <TabsTrigger
          className='text-lg data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none'
          value="delivery"
        >
          <MdOutlineDeliveryDining size={32} />DOSTAWA
        </TabsTrigger>
        <TabsTrigger
          className='text-lg data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none' value="take-out"
        >
          <MdOutlineRestaurantMenu size={32} />ODBIÓR
        </TabsTrigger>
      </TabsList>
      <TabsContent value="delivery">
        <PageSubHeader title='Sprawdź czy dowozimy do Ciebie' />
        <DeliveryForm />
      </TabsContent>
      <TabsContent value="take-out">
        <PageSubHeader title='Wybierz czas odbioru zamówienia' />
        <div className="flex flex-col space-y-4">
          <TimeSelector
            selectedTime={selectedTime}
            onTimeChange={handleTimeChange}
            setNearestHour={getNearestHour} // Повертає Date
            filterTime={filterTime}
          />
          <div className='w-full'>
            <LoadingButton
              className='w-full px-4 py-2 rounded shadow transition'
              onClick={handleOrder}
              isLoading={loading}
            >
              Do zamówienia <MdOutlineKeyboardArrowRight />
            </LoadingButton>
          </div>
        </div>
        <RestaurantMap
          className='my-4'
          center={RESTAURANT_COORDINATES}
          zoom={15}
          markers={[RESTAURANT_COORDINATES]}
        />
      </TabsContent>
    </Tabs>
  )
}
