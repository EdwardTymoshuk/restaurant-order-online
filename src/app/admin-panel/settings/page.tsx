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
  Pencil,
  X,
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
  const [activeTab, setActiveTab] = useState<'company' | 'operations' | 'content' | 'users' | 'notifications'>('company')
  const [editingWaitTime, setEditingWaitTime] = useState(false)
  const [editingReservationLimits, setEditingReservationLimits] = useState(false)

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
        { id: 'notifications' as const, label: 'Powiadomienia', icon: BellRing },
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

        {activeTab === 'operations' && <section className="grid items-stretch gap-4 xl:grid-cols-4">
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
              <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-2.5">
                <p className="text-sm font-medium text-slate-900">Przyjmowanie zamówień</p>
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
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Timer size={20} /></div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Czas oczekiwania</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Domyślny czas realizacji zamówienia.</p>
                  </div>
                </div>
                {canManageSettings && <Button type="button" variant="outline" size="sm" onClick={() => { if (editingWaitTime) setOrderWaitTime(settingsData?.orderWaitTime ?? 30); setEditingWaitTime((current) => !current) }}>
                  {editingWaitTime ? <X className="mr-1.5 size-4" /> : <Pencil className="mr-1.5 size-4" />}
                  {editingWaitTime ? 'Anuluj' : 'Zmień'}
                </Button>}
              </div>
              {editingWaitTime ? <div className="flex gap-2">
                <Select value={orderWaitTime.toString()} onValueChange={(value) => setOrderWaitTime(Number(value))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['30', '45', '60', '75', '90', '120'].map((value) => <SelectItem key={value} value={value}>{value} minut</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" onClick={() => { updateOrderWaitTime.mutate({ orderWaitTime }); setEditingWaitTime(false) }}>Zapisz</Button>
              </div> : <p className="text-2xl font-semibold tabular-nums text-slate-950">{orderWaitTime} <span className="text-sm font-medium text-muted-foreground">minut</span></p>}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarCheck size={20} /></div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Rezerwacje online</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Zasady przyjmowania rezerwacji.</p>
                  </div>
                </div>
                {canManageSettings && <Button type="button" variant="outline" size="sm" onClick={() => { if (editingReservationLimits) { setReservationCapacity(settingsData?.reservationCapacity ?? 40); setReservationMinGuests(settingsData?.reservationMinGuests ?? 12) }; setEditingReservationLimits((current) => !current) }}>
                  {editingReservationLimits ? <X className="mr-1.5 size-4" /> : <Pencil className="mr-1.5 size-4" />}
                  {editingReservationLimits ? 'Anuluj' : 'Zmień'}
                </Button>}
              </div>
              {!editingReservationLimits ? <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 px-3 py-2.5"><p className="text-xs text-muted-foreground">Maksymalna liczba gości jednocześnie</p><p className="mt-1 text-lg font-semibold text-slate-950">{reservationCapacity} <span className="text-sm font-medium text-muted-foreground">osób</span></p></div>
                <div className="rounded-lg bg-muted/30 px-3 py-2.5"><p className="text-xs text-muted-foreground">Minimalna liczba osób w rezerwacji</p><p className="mt-1 text-lg font-semibold text-slate-950">{reservationMinGuests} <span className="text-sm font-medium text-muted-foreground">osób</span></p></div>
              </div> : <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">Maksymalna liczba gości jednocześnie<Input type="number" min={1} max={500} value={reservationCapacity} onChange={(event) => setReservationCapacity(Number(event.target.value))} /></label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700">Minimalna liczba osób w rezerwacji<Input type="number" min={1} max={500} value={reservationMinGuests} onChange={(event) => setReservationMinGuests(Number(event.target.value))} /></label>
                </div>
                <Button size="sm" className="mt-3" disabled={reservationMinGuests > reservationCapacity || updateReservationCapacity.isLoading} onClick={() => { updateReservationCapacity.mutate({ reservationCapacity, reservationMinGuests }); setEditingReservationLimits(false) }}>Zapisz</Button>
              </>}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Pizza size={20} /></div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Pizza</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Dostępność kategorii i godziny sprzedaży.</p>
                </div>
              </div>
              <PizzaSettings
                settingsData={{
                  pizzaCategoryEnabled: settingsData?.pizzaCategoryEnabled ?? false,
                  pizzaAvailability: Array.isArray(settingsData?.pizzaAvailability)
                    ? (settingsData?.pizzaAvailability as { day: number; startHour: number; endHour: number }[])
                    : [],
                }}
                refetchSettings={refetchSettings}
              />
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

          </>
        )}

        {canViewSettings && activeTab === 'content' && (
          <>
            <section className="grid gap-4 xl:grid-cols-2">
              <SettingsModule title="Kody promocyjne" description="Rabaty, daty ważności i jednorazowe kody." icon={BadgePercent} count={promoCodesData.length}>
                <PromoCodeSettings />
              </SettingsModule>
              <SettingsModule title="Wydarzenia" description="Aktualności i komunikaty widoczne na stronie restauracji." icon={Newspaper} count={eventsData.length}>
                <EventSettings />
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

          </>
        )}

        {activeTab === 'notifications' && (
          <SettingsModule
            title="Powiadomienia"
            description="Włącz alerty o nowych zamówieniach i rezerwacjach na tym urządzeniu."
            icon={BellRing}
          >
            <PushNotificationsSettings />
          </SettingsModule>
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
