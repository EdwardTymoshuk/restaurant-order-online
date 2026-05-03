'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Card, CardContent } from '@/app/components/ui/card'
import { trpc } from '@/utils/trpc'
import { useEffect, useState } from 'react'

import DeliveryZonesSettings from '@/app/admin-panel/components/DeliveryZonesSettings'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import {
  BadgePercent,
  Bike,
  Image as ImageIcon,
  Newspaper,
  Pizza,
  Settings2,
  ShoppingBag,
  Timer,
} from 'lucide-react'
import BannerSettings from '../components/BannerSettings' // Import the new component
import EventSettings from '../components/EventSettings'
import MainPageBannerSettings from '../components/MainPageBannerSettings'
import { PageHeader } from '../components/PageHeader'
import PizzaSettings from '../components/PizzaSettings'
import PromoCodeSettings from '../components/PromoCodeSettings'
import UserList from '../components/UserList'

const SettingsModule = ({
  title,
  description,
  icon: Icon,
  count,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  count?: string | number
  children: React.ReactNode
}) => (
  <Card className="border-border shadow-sm">
    <CardContent className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {count !== undefined && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div className="[&_[data-orientation=vertical]]:border-0 [&_button]:hover:no-underline">
        {children}
      </div>
    </CardContent>
  </Card>
)

const Settings = () => {
  // Check if the user is an admin
  const isAdmin = useIsAdmin()

  // === Fetch general settings ===
  const { data: settingsData, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery()
  const { data: promoCodesData = [] } = trpc.promoCode.getAllPromoCodes.useQuery()
  const { data: orderBannersData = [] } = trpc.banner.getAllBanners.useQuery()
  const { data: mainBannersData = [] } = trpc.mainPageBanner.getAllMainBanners.useQuery()
  const { data: eventsData = [] } = trpc.news.getNews.useQuery()
  const { data: usersData = [] } = trpc.user.getAllUsers.useQuery(undefined, {
    enabled: isAdmin,
  })
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
    <>
      <PageHeader title="Ustawienia" />

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <section className="grid gap-5 xl:grid-cols-2">
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Zamówienia online</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Podstawowa dostępność zamówień dla klientów.</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Przyjmowanie zamówień</p>
                  <p className="text-xs text-muted-foreground">
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

          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Timer size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Czas oczekiwania</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Domyślny czas realizacji zamówienia online.</p>
                </div>
              </div>
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
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <SettingsModule title="Strefy dostaw" description="Promienie i ceny dostawy dla zamówień online." icon={Bike} count={deliveryZones.length}>
          <DeliveryZonesSettings
            deliveryZones={deliveryZones}
            onUpdateZones={updateDeliveryZonePrices.mutate}
          />
          </SettingsModule>

          <SettingsModule title="Pizza" description="Dostępność kategorii pizzy oraz harmonogram sprzedaży." icon={Pizza} count={settingsData?.pizzaAvailability && Array.isArray(settingsData.pizzaAvailability) ? settingsData.pizzaAvailability.length : 0}>
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
          </SettingsModule>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SettingsModule title="Kody promocyjne" description="Rabaty, daty ważności i jednorazowe kody." icon={BadgePercent} count={promoCodesData.length}>
          <PromoCodeSettings />
          </SettingsModule>

          <SettingsModule title="Banery order.spokosopot.pl" description="Banery reklamowe widoczne w systemie zamówień." icon={ImageIcon} count={orderBannersData.length}>
          <BannerSettings />
          </SettingsModule>

          <SettingsModule title="Banery spokosopot.pl" description="Banery strony głównej restauracji." icon={ImageIcon} count={mainBannersData.length}>
          <MainPageBannerSettings />
          </SettingsModule>

          <SettingsModule title="Wydarzenia" description="Aktualności i wydarzenia widoczne na stronie." icon={Newspaper} count={eventsData.length}>
          <EventSettings />
          </SettingsModule>
        </div>

        {isAdmin && (
          <SettingsModule title="Użytkownicy" description="Konta administratorów i operatorów panelu." icon={Settings2} count={usersData.length}>
            <UserList />
          </SettingsModule>
        )}
      </div>
    </>
  )
}

export default Settings
