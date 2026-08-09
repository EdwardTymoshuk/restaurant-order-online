'use client'

import {
  Button,
} from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
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
import RestaurantInfoSettings from '@/app/admin-panel/components/RestaurantInfoSettings'
import { useIsAdmin } from '@/hooks/useRole'
import { useHasPermission } from '@/hooks/usePermission'
import { PERMISSIONS } from '@/lib/roles'
import {
  BadgePercent,
  Bike,
  CalendarCheck,
  Image as ImageIcon,
  Images,
  Newspaper,
  Pizza,
  BellRing,
  Settings2,
  ShoppingBag,
  Store,
  Timer,
} from 'lucide-react'
import BannerSettings from '../components/BannerSettings' // Import the new component
import EventSettings from '../components/EventSettings'
import GallerySettings from '../components/GallerySettings'
import MainPageBannerSettings from '../components/MainPageBannerSettings'
import { PageHeader } from '../components/PageHeader'
import PizzaSettings from '../components/PizzaSettings'
import PromoCodeSettings from '../components/PromoCodeSettings'
import { PushNotificationsSettings } from '../components/PushNotificationsSettings'
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
  const canViewSettings = useHasPermission(PERMISSIONS.SETTINGS_VIEW)
  const canManageSettings = useHasPermission(PERMISSIONS.SETTINGS_MANAGE)
  const [activeTab, setActiveTab] = useState<'company' | 'operations' | 'content' | 'users'>('company')

  // === Fetch general settings ===
  const { data: settingsData, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery()
  const { data: promoCodesData = [] } = trpc.promoCode.getAllPromoCodes.useQuery()
  const { data: orderBannersData = [] } = trpc.banner.getAllBanners.useQuery()
  const { data: mainBannersData = [] } = trpc.mainPageBanner.getAllMainBanners.useQuery()
  const { data: eventsData = [] } = trpc.news.getNews.useQuery()
  const { data: galleryData = [] } = trpc.gallery.getGalleryImages.useQuery()
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
  const [reservationCapacity, setReservationCapacity] = useState(40)
  const [reservationMinGuests, setReservationMinGuests] = useState(12)

  useEffect(() => {
    if (settingsData) {
      setIsOrderingOpen(settingsData.isOrderingOpen)
      setOrderWaitTime(settingsData.orderWaitTime)
      setReservationCapacity(settingsData.reservationCapacity ?? 40)
      setReservationMinGuests(settingsData.reservationMinGuests ?? 12)
      setDeliveryZones(
        Array.isArray(settingsData.deliveryZones)
          ? settingsData.deliveryZones
          : []
      )
    }
  }, [settingsData])

  const updateReservationCapacity = trpc.settings.updateReservationCapacity.useMutation({
    onSuccess: () => refetchSettings(),
  })

  const settingsTabs = (
    <div className="flex items-center gap-1">
      {[
        { id: 'company' as const, label: 'Firma', icon: Store },
        { id: 'operations' as const, label: 'Operacje', icon: Settings2 },
        { id: 'content' as const, label: 'Treści', icon: Images },
        ...(isAdmin ? [{ id: 'users' as const, label: 'Użytkownicy', icon: Settings2 }] : []),
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setActiveTab(id)}
          className={`inline-flex h-9 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors ${
            activeTab === id
              ? 'border-primary text-slate-950'
              : 'border-transparent text-muted-foreground hover:text-slate-900'
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <PageHeader title="Ustawienia" tabs={settingsTabs} />

      <div className="space-y-5 p-4 md:p-6 lg:p-8">
        {canViewSettings && activeTab === 'company' && (
          <SettingsModule
            title="Informacje restauracji"
            description="Dane kontaktowe, stałe godziny oraz czasowe zmiany widoczne na spokosopot.pl."
            icon={Store}
          >
            <RestaurantInfoSettings
              settingsData={{
                restaurantInfo: settingsData?.restaurantInfo,
                openingHours: settingsData?.openingHours,
                openingHourOverrides: settingsData?.openingHourOverrides,
              }}
              refetchSettings={refetchSettings}
            />
          </SettingsModule>
        )}

        {activeTab === 'operations' && <section className="grid gap-5 xl:grid-cols-3">
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
                  disabled={!canManageSettings}
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
                  <BellRing size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Powiadomienia</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Alerty o nowych zamówieniach i rezerwacjach na tym urządzeniu.</p>
                </div>
              </div>
              <PushNotificationsSettings />
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
                disabled={!canManageSettings}
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

          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Rezerwacje</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Wspólna pojemność dla formularza klienta i panelu.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  Maksymalnie jednocześnie
                  <Input disabled={!canManageSettings} type="number" min={1} max={500} value={reservationCapacity} onChange={(event) => setReservationCapacity(Number(event.target.value))} />
                  <span className="block text-xs font-normal text-muted-foreground">Liczba gości możliwa w tym samym czasie.</span>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  Minimum online
                  <Input disabled={!canManageSettings} type="number" min={1} max={500} value={reservationMinGuests} onChange={(event) => setReservationMinGuests(Number(event.target.value))} />
                  <span className="block text-xs font-normal text-muted-foreground">Minimalna liczba gości w formularzu eventowym.</span>
                </label>
              </div>
              <Button
                size="sm"
                className="mt-4"
                disabled={!canManageSettings || updateReservationCapacity.isLoading || reservationMinGuests > reservationCapacity}
                onClick={() => updateReservationCapacity.mutate({ reservationCapacity, reservationMinGuests })}
              >
                {updateReservationCapacity.isLoading ? 'Zapisywanie...' : 'Zapisz limity'}
              </Button>
            </CardContent>
          </Card>
        </section>}

          {canViewSettings && activeTab === 'operations' && (
          <>
            <section>
              <SettingsModule title="Strefy dostaw" description="Promienie i ceny dostawy dla zamówień online." icon={Bike} count={deliveryZones.length}>
                <DeliveryZonesSettings
                  deliveryZones={deliveryZones}
                  onUpdateZones={updateDeliveryZonePrices.mutate}
                />
              </SettingsModule>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
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
            </section>
          </>
        )}

        {canViewSettings && activeTab === 'content' && (
          <>
            <section>
              <SettingsModule title="Kody promocyjne" description="Rabaty, daty ważności i jednorazowe kody." icon={BadgePercent} count={promoCodesData.length}>
                <PromoCodeSettings />
              </SettingsModule>
            </section>
            <section className="grid gap-5 xl:grid-cols-2">
              <SettingsModule title="Banery order.spokosopot.pl" description="Banery reklamowe widoczne w systemie zamówień." icon={ImageIcon} count={orderBannersData.length}>
                <BannerSettings />
              </SettingsModule>

              <SettingsModule title="Banery spokosopot.pl" description="Banery strony głównej restauracji." icon={ImageIcon} count={mainBannersData.length}>
                <MainPageBannerSettings />
              </SettingsModule>
            </section>

            <section>
              <SettingsModule title="Galeria spokosopot.pl" description="Zdjęcia podzielone na kategorie widoczne na stronie restauracji." icon={Images} count={galleryData.length}>
                <GallerySettings />
              </SettingsModule>
            </section>

            <section>
              <SettingsModule title="Wydarzenia" description="Aktualności widoczne na stronie." icon={Newspaper} count={eventsData.length}>
                <EventSettings />
              </SettingsModule>
            </section>
          </>
        )}

        {isAdmin && activeTab === 'users' && (
          <section>
            <SettingsModule title="Użytkownicy" description="Konta panelu i ich uprawnienia." icon={Settings2} count={usersData.length}>
              <UserList />
            </SettingsModule>
          </section>
        )}
      </div>
    </>
  )
}

export default Settings
