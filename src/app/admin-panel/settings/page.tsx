'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { trpc } from '@/utils/trpc'
import { useEffect, useState } from 'react'

import DeliveryZonesSettings from '@/app/admin-panel/components/DeliveryZonesSettings'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import BannerSettings from '../components/BannerSettings' // Import the new component
import EventSettings from '../components/EventSettings'
import MainPageBannerSettings from '../components/MainPageBannerSettings'
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
    <div className="space-y-5 p-1">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ustawienia</h1>
        <p className="text-sm text-slate-500">
          Zarządzaj konfiguracją systemu i sekcjami widocznymi dla gości.
        </p>
      </div>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Zamówienia online</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Przyjmowanie zamówień</p>
              <p className="text-xs text-slate-500">
                Status: {isOrderingOpen ? 'Aktywne' : 'Wyłączone'}
              </p>
            </div>
            <Switch
              checked={isOrderingOpen}
              onCheckedChange={(checked) => {
                setIsOrderingOpen(checked)
                updateOrderingState.mutate({ isOrderingOpen: checked })
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Czas oczekiwania</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardContent className="pt-6">
          <DeliveryZonesSettings
            deliveryZones={deliveryZones}
            onUpdateZones={updateDeliveryZonePrices.mutate}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardContent className="pt-6">
          <PromoCodeSettings />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardContent className="pt-6">
          <BannerSettings />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardContent className="pt-6">
          <MainPageBannerSettings />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardContent className="pt-6">
          <EventSettings />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-slate-200 shadow-none">
          <CardContent className="pt-6">
            <UserList />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Settings
