'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { trpc } from '@/utils/trpc'
import { useEffect, useState } from 'react'

import DeliveryZonesSettings from '@/app/admin-panel/components/DeliveryZonesSettings'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import BannerSettings from '../components/BannerSettings' // Import the new component
import EventSettings from '../components/EventSettings'
import PizzaSettings from '../components/PizzaSettings'
import PromoCodeSettings from '../components/PromoCodeSettings'
import UserList from '../components/UserList'

const Settings = () => {
  // Check if the user is an admin
  const isAdmin = useIsAdmin()

  // === Fetch general settings ===
  const { data: settingsData, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery()
  const updateOrderingState = trpc.settings.updateOrderingState.useMutation({
    onSuccess: () => refetchSettings(),
  })
  const updateOrderWaitTime = trpc.settings.updateOrderWaitTime.useMutation({
    onSuccess: () => refetchSettings(),
  })
  const updateDeliveryZonePrices =
    trpc.settings.updateDeliveryZonePrices.useMutation({
      onSuccess: () => refetchSettings(),
    })

  const [isOrderingOpen, setIsOrderingOpen] = useState<boolean>(false)
  const [orderWaitTime, setOrderWaitTime] = useState<number>(30)
  const [deliveryZones, setDeliveryZones] = useState<any[]>([])

  useEffect(() => {
    if (settingsData) {
      setIsOrderingOpen(settingsData.isOrderingOpen)
      setOrderWaitTime(settingsData.orderWaitTime)
      setDeliveryZones(
        Array.isArray(settingsData.deliveryZones)
          ? settingsData.deliveryZones
          : []
      )
    }
  }, [settingsData])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ustawienia</h1>
      <div className="space-y-8">
        {/* Online ordering settings */}
        <section>
          <h2 className="text-xl font-semibold">Zamówienia Online</h2>
          <div className="flex items-center space-x-4">
            <Switch
              checked={isOrderingOpen}
              onCheckedChange={(checked) => {
                setIsOrderingOpen(checked)
                updateOrderingState.mutate({ isOrderingOpen: checked })
              }}
            />
            <span>{isOrderingOpen ? 'Aktywne' : 'Wyłączone'}</span>
          </div>
        </section>

        {/* Delivery zones settings */}
        <section>
          <DeliveryZonesSettings
            deliveryZones={deliveryZones}
            onUpdateZones={updateDeliveryZonePrices.mutate}
          />
        </section>

        {/* Pizza settings */}
        <section>
          <PizzaSettings
            settingsData={{
              pizzaCategoryEnabled: settingsData?.pizzaCategoryEnabled ?? false,
              pizzaAvailability: Array.isArray(settingsData?.pizzaAvailability)
                ? (settingsData?.pizzaAvailability as {
                    day: number
                    startHour: number
                    endHour: number
                  }[])
                : [],
            }}
            refetchSettings={refetchSettings}
          />
        </section>

        {/* Order waiting time settings */}
        <section>
          <h2 className="text-xl font-semibold">Czas oczekiwania</h2>
          <Select
            value={orderWaitTime.toString()}
            onValueChange={(value) => {
              const newTime = Number(value)
              setOrderWaitTime(newTime)
              updateOrderWaitTime.mutate({ orderWaitTime: newTime })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Wybierz czas oczekiwania" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minut</SelectItem>
              <SelectItem value="45">45 minut</SelectItem>
              <SelectItem value="60">60 minut</SelectItem>
              <SelectItem value="75">75 minut</SelectItem>
              <SelectItem value="90">90 minut</SelectItem>
              <SelectItem value="120">120 minut</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Promo code settings */}
        <section>
          <PromoCodeSettings />
        </section>

        {/* Banner settings (now in a separate component) */}
        <section>
          <BannerSettings />
        </section>

        {/* Event settings */}
        <section>
          <EventSettings />
        </section>

        {/* User management (admin only) */}
        {isAdmin && (
          <section>
            <UserList />
          </section>
        )}
      </div>
    </div>
  )
}

export default Settings
