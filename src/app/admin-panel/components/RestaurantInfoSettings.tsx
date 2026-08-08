'use client'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import type { OpeningHour, OpeningHourOverride, RestaurantInfo } from '@/app/types/types'
import { trpc } from '@/utils/trpc'
import { CalendarDays, Mail, MapPin, Phone, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const DEFAULT_INFO: RestaurantInfo = { name: 'Restauracja Spoko', phone: '530 659 666', email: 'info@spokosopot.pl', address: 'Hestii 3, 81-731 Sopot' }
const DEFAULT_HOURS: OpeningHour[] = DAY_NAMES.map((_, index) => ({
  day: index + 1,
  isClosed: false,
  start: index < 5 ? '10:00' : '08:00',
  end: '19:00',
}))

type Props = {
  settingsData?: {
    restaurantInfo?: unknown
    openingHours?: unknown
    openingHourOverrides?: unknown
  }
  refetchSettings: () => Promise<unknown>
}

const parseInfo = (value: unknown): RestaurantInfo => ({
  ...DEFAULT_INFO,
  ...(value && typeof value === 'object' ? value : {}),
}) as RestaurantInfo

const parseHours = (value: unknown): OpeningHour[] => {
  if (!Array.isArray(value)) return DEFAULT_HOURS
  return DAY_NAMES.map((_, index) => {
    const item = value.find((candidate) => candidate && typeof candidate === 'object' && (candidate as { day?: number }).day === index + 1) as Partial<OpeningHour> | undefined
    return { ...DEFAULT_HOURS[index], ...item, day: index + 1 }
  })
}

const parseOverrides = (value: unknown): OpeningHourOverride[] =>
  Array.isArray(value) ? value as OpeningHourOverride[] : []

const RestaurantInfoSettings = ({ settingsData, refetchSettings }: Props) => {
  const [info, setInfo] = useState<RestaurantInfo>(DEFAULT_INFO)
  const [hours, setHours] = useState<OpeningHour[]>(DEFAULT_HOURS)
  const [overrides, setOverrides] = useState<OpeningHourOverride[]>([])
  const updateSettings = trpc.settings.updateRestaurantInfo.useMutation()

  useEffect(() => {
    setInfo(parseInfo(settingsData?.restaurantInfo))
    setHours(parseHours(settingsData?.openingHours))
    setOverrides(parseOverrides(settingsData?.openingHourOverrides))
  }, [settingsData])

  const save = async () => {
    try {
      await updateSettings.mutateAsync({ restaurantInfo: info, openingHours: hours, openingHourOverrides: overrides })
      await refetchSettings()
      toast.success('Informacje restauracji zostały zapisane.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać ustawień.')
    }
  }

  const updateHour = (day: number, patch: Partial<OpeningHour>) => {
    setHours((current) => current.map((item) => item.day === day ? { ...item, ...patch } : item))
  }

  const addOverride = () => {
    setOverrides((current) => [...current, {
      id: crypto.randomUUID(),
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      type: 'hours',
      start: '10:00',
      end: '16:00',
      title: 'Zmiana godzin otwarcia',
      message: 'W podanym terminie obowiązują zmienione godziny otwarcia restauracji.',
    }])
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="restaurant-name">Nazwa restauracji</Label>
          <Input id="restaurant-name" value={info.name} onChange={(event) => setInfo({ ...info, name: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="restaurant-address"><MapPin className="mr-1 inline size-4" />Adres</Label>
          <Input id="restaurant-address" value={info.address} onChange={(event) => setInfo({ ...info, address: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="restaurant-phone"><Phone className="mr-1 inline size-4" />Telefon</Label>
          <Input id="restaurant-phone" value={info.phone} onChange={(event) => setInfo({ ...info, phone: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="restaurant-email"><Mail className="mr-1 inline size-4" />Email</Label>
          <Input id="restaurant-email" type="email" value={info.email} onChange={(event) => setInfo({ ...info, email: event.target.value })} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Stałe godziny otwarcia</h3>
          <p className="text-xs text-muted-foreground">Godziny będą grupowane na stronie, jeśli są takie same dla kolejnych dni.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[680px] divide-y divide-border">
            {hours.map((item, index) => (
              <div key={item.day} className="grid grid-cols-[1.3fr_auto_110px_110px] items-center gap-3 px-3 py-3">
                <span className="text-sm font-medium text-slate-900">{DAY_NAMES[index]}</span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={item.isClosed} onChange={(event) => updateHour(item.day, { isClosed: event.target.checked })} />
                  Zamknięte
                </label>
                <Input type="time" disabled={item.isClosed} value={item.start} onChange={(event) => updateHour(item.day, { start: event.target.value })} aria-label={`${DAY_NAMES[index]} otwarcie`} />
                <Input type="time" disabled={item.isClosed} value={item.end} onChange={(event) => updateHour(item.day, { end: event.target.value })} aria-label={`${DAY_NAMES[index]} zamknięcie`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Czasowe zmiany i dni wolne</h3>
            <p className="text-xs text-muted-foreground">Ustaw zakres dat, zmienione godziny albo całkowite zamknięcie.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOverride}><Plus className="mr-1 size-4" />Dodaj wyjątek</Button>
        </div>
        {overrides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Brak zaplanowanych wyjątków.</div>
        ) : (
          <div className="space-y-3">
            {overrides.map((item) => (
              <div key={item.id} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.3fr_auto]">
                  <div className="space-y-1"><Label>Od</Label><Input type="date" value={item.startDate} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: event.target.value } : entry))} /></div>
                  <div className="space-y-1"><Label>Do</Label><Input type="date" value={item.endDate} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: event.target.value } : entry))} /></div>
                  <div className="space-y-1"><Label>Rodzaj</Label><Select value={item.type} onValueChange={(value: 'hours' | 'closed') => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, type: value } : entry))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hours">Zmienione godziny</SelectItem><SelectItem value="closed">Restauracja zamknięta</SelectItem></SelectContent></Select></div>
                  <Button type="button" variant="ghost" size="icon" className="mt-5 text-destructive" onClick={() => setOverrides((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Usuń wyjątek"><Trash2 className="size-4" /></Button>
                </div>
                {item.type === 'hours' && <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Otwarcie</Label><Input type="time" value={item.start ?? '10:00'} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, start: event.target.value } : entry))} /></div><div className="space-y-1"><Label>Zamknięcie</Label><Input type="time" value={item.end ?? '16:00'} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, end: event.target.value } : entry))} /></div></div>}
                <div className="space-y-1"><Label>Tytuł komunikatu</Label><Input value={item.title} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry))} /></div>
                <div className="space-y-1"><Label>Treść komunikatu</Label><Textarea value={item.message} onChange={(event) => setOverrides((current) => current.map((entry) => entry.id === item.id ? { ...entry, message: event.target.value } : entry))} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="button" onClick={save} disabled={updateSettings.isLoading}><Save className="mr-2 size-4" />{updateSettings.isLoading ? 'Zapisywanie...' : 'Zapisz informacje i godziny'}</Button>
    </div>
  )
}

export default RestaurantInfoSettings
