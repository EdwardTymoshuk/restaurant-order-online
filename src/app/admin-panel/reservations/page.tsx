'use client'

import { Button } from '@/app/components/ui/button'
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader as ConfirmDialogHeader,
  DialogTitle as ConfirmDialogTitle,
} from '@/app/components/ui/dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Textarea } from '@/app/components/ui/textarea'
import { trpc } from '@/utils/trpc'
import { cn } from '@/utils/utils'
import { EventType, PackageCode, Prisma, ReservationExtraType, ReservationStatus } from '@prisma/client'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  LockOpen,
  Mail,
  Minus,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { useAdminRealtime } from '../hooks/useAdminRealtime'
import { PageHeader } from '../components/PageHeader'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationListItem = Prisma.ReservationGetPayload<{
  include: {
    offerSnapshot: { select: { total: true; packageCode: true } }
    contact: { select: { name: true; phone: true } }
  }
}>

type ReservationDetail = Prisma.ReservationGetPayload<{
  include: {
    offerSnapshot: true
    extras: true
    contact: true
    summaryPdf: { select: { filename: true; createdAt: true } }
  }
}>

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
const WEEKDAYS_FULL = ['PON', 'WTO', 'ŚRO', 'CZW', 'PIĄ', 'SOB', 'NIE']

const statusBadgeMap: Record<ReservationStatus, string> = {
  DRAFT:     'bg-slate-100 text-slate-500',
  SENT:      'bg-amber-50 text-amber-700 border border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border border-red-200',
}

const statusLabelMap: Record<ReservationStatus, string> = {
  DRAFT:     'Szkic',
  SENT:      'Nowe',
  CONFIRMED: 'Potwierdzone',
  CANCELLED: 'Anulowane',
}

const packageLabelMap: Record<PackageCode, string> = {
  SILVER:   'Silver',
  GOLD:     'Gold',
  PLATINUM: 'Platinum',
}

const eventTypeLabelMap: Record<EventType, string> = {
  BIRTHDAY:      'Urodziny',
  ANNIVERSARY:   'Rocznica',
  COMMUNION:     'Komunia',
  CHRISTENING:   'Chrzciny',
  COMPANY_EVENT: 'Impreza firmowa',
  WEDDING:       'Wesele',
  OTHER:         'Inne',
}

const PACKAGES: { code: PackageCode; label: string; desc: string }[] = [
  { code: 'SILVER',   label: 'Silver',   desc: 'Podstawowy' },
  { code: 'GOLD',     label: 'Gold',     desc: 'Rozszerzony' },
  { code: 'PLATINUM', label: 'Platinum', desc: 'Premium' },
]

// ─── Time options ──────────────────────────────────────────────────────────────

const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = []
  for (let total = 9 * 60; total <= 26 * 60; total += 30) {
    const h = Math.floor(total / 60) % 24
    const m = total % 60
    opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return opts
})()

// ─── Full-reservation item lists ───────────────────────────────────────────────

type AdminItem = { id: string; title: string; price: number; unit: string }

const ADMIN_COLD_PLATE_SETS: AdminItem[] = [
  { id: 'bruschetta',          title: '🧀 Set Bruschett',                   price: 69,  unit: 'set' },
  { id: 'tatar',               title: '🐟 Set Słoików Tatarów',             price: 109, unit: 'set' },
  { id: 'tartaletki',          title: '🍰 Set Mini Tartaletek',             price: 69,  unit: 'set' },
  { id: 'mini-burgery',        title: '🍔 Set Mini Burgerów',               price: 149, unit: 'set' },
  { id: 'krewetki',            title: '🔥 Krewetki z ogniem',               price: 62,  unit: 'set' },
  { id: 'mini-nalesniki',      title: '🥞 Set Mini Naleśników',             price: 109, unit: 'set' },
  { id: 'mini-croissanty',     title: '🥐 Set Mini Croissantów',            price: 69,  unit: 'set' },
  { id: 'szaszlyki-krewetki',  title: '🍤 Szaszłyki z krewetkami',          price: 219, unit: 'set' },
  { id: 'dary-morza',          title: '🌊 Set Dary Morza',                  price: 169, unit: 'set' },
  { id: 'tataki-tunczyk',      title: '🐟 Tataki z tuńczyka',               price: 62,  unit: 'set' },
  { id: 'tartaletki-kawiorem', title: '🥟 Tartaletki z kawiorem',           price: 229, unit: 'set' },
]

const ADMIN_COLD_PLATE_SALADS: AdminItem[] = [
  { id: 'caesar_chicken', title: '🥗 Sałatka Cesarska z Kurczakiem 500g', price: 89,  unit: 'miseczka' },
  { id: 'caesar_shrimp',  title: '🍤 Sałatka Cesarska z Krewetkami 500g', price: 99,  unit: 'miseczka' },
  { id: 'greek',          title: '🇬🇷 Sałatka Grecka 500g',               price: 79,  unit: 'miseczka' },
  { id: 'smoked_chicken', title: '🥓 Sałatka z Wędzonym Kurczakiem',       price: 85,  unit: 'miseczka' },
]

const ADMIN_DESSERTS: AdminItem[] = [
  { id: 'cake_trio_platter', title: 'Sernik + szarlotka + brownie', price: 189, unit: 'set' },
  { id: 'mini_tiramisu',     title: '☕ Mini tiramisu',              price: 16,  unit: 'szt.' },
  { id: 'mini_panna_cotta',  title: '🍮 Mini panna cotta',           price: 15,  unit: 'szt.' },
  { id: 'mini_chia',         title: '🌱 Mini pudding chia',          price: 15,  unit: 'szt.' },
]

const ADMIN_SOFT_DRINKS: AdminItem[] = [
  { id: 'apple_juice_jug',  title: 'Sok jabłkowy (dzbanek 1l)',     price: 30, unit: 'dzbanek' },
  { id: 'orange_juice_jug', title: 'Sok pomarańczowy (dzbanek 1l)', price: 30, unit: 'dzbanek' },
  { id: 'lemonade_jug',     title: 'Lemoniada (dzbanek 1.5l)',       price: 62, unit: 'dzbanek' },
  { id: 'cola_bottle',      title: 'Cola (850ml)',                   price: 25, unit: 'butelka' },
  { id: 'cola_zero_bottle', title: 'Cola Zero (850ml)',              price: 25, unit: 'butelka' },
]

const ADMIN_ALCOHOL: AdminItem[] = [
  { id: 'ballantines_500',  title: "Ballantine's 500ml",   price: 149, unit: 'butelka' },
  { id: 'jameson_500',      title: 'Jameson 500ml',        price: 169, unit: 'butelka' },
  { id: 'jack_daniels_500', title: "Jack Daniel's 500ml",  price: 199, unit: 'butelka' },
  { id: 'wyborowa_500',     title: 'Wódka Wyborowa 500ml', price: 99,  unit: 'butelka' },
  { id: 'absolut_500',      title: 'Wódka Absolut 500ml',  price: 119, unit: 'butelka' },
]

const EXTENSION_PRICE: Record<PackageCode, number> = { SILVER: 500, GOLD: 400, PLATINUM: 300 }
const PACKAGE_PRICE: Record<PackageCode, number> = { SILVER: 199, GOLD: 219, PLATINUM: 249 }

const CAKE_OPTIONS = [
  { value: 'own_cake',            label: 'Przyniosę własny tort' },
  { value: 'need_bakery_contact', label: 'Proszę o kontakt do cukierni' },
  { value: 'skip',                label: 'Pominięcie etapu' },
] as const

const SOUP_OPTIONS = [
  { value: 'tomato_cream',  label: 'Krem z pomidora z bazyliowym pesto' },
  { value: 'chicken_broth', label: 'Rosół z kury z makaronem' },
] as const

const TABS = [
  { value: 'new',       label: 'Nowe',       statuses: ['SENT'] as ReservationStatus[] },
  { value: 'confirmed', label: 'Potwierdzone', statuses: ['CONFIRMED'] as ReservationStatus[] },
  { value: 'done',      label: 'Zakończone',  statuses: ['CANCELLED', 'DRAFT'] as ReservationStatus[] },
]

// Dot color per status
const DOT_COLOR: Record<ReservationStatus, string> = {
  SENT:      'bg-amber-400',
  CONFIRMED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-300',
  DRAFT:     'bg-slate-200',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd')
const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const Counter = ({
  label, value, onChange, min = 0,
}: { label: string; value: number; onChange: (v: number) => void; min?: number }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-xs font-sans text-muted-foreground">{label}</p>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Minus size={13} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  </div>
)

// ─── Mini calendar (for add form) ─────────────────────────────────────────────

const MiniCalendar = ({
  value,
  onChange,
  blockedKeys = new Set<string>(),
  takenKeys = new Set<string>(),
}: {
  value: Date | null
  onChange: (d: Date) => void
  blockedKeys?: Set<string>
  takenKeys?: Set<string>
}) => {
  const [month, setMonth] = useState(value ?? new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
        <button onClick={() => setMonth((m) => subMonths(m, 1))}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronLeft size={13} />
        </button>
        <span className="text-sm font-semibold capitalize">
          {format(month, 'LLLL yyyy', { locale: pl })}
        </span>
        <button onClick={() => setMonth((m) => addMonths(m, 1))}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-border">
        {['Pn','Wt','Śr','Cz','Pt','Sb','Nd'].map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground py-1.5 border-r border-border/50 last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const key = toDateKey(date)
          const isPast = date < today
          const isBlocked = blockedKeys.has(key)
          const isTaken = takenKeys.has(key)
          const isDisabled = isPast || isBlocked || isTaken
          const isSelected = value ? isSameDay(date, value) : false
          const isCurMonth = isSameMonth(date, month)
          const _isToday = isToday(date)
          return (
            <button
              key={key}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(date)}
              title={isBlocked ? 'Zablokowane' : isTaken ? 'Termin zajęty' : undefined}
              className={cn(
                'py-1.5 text-xs font-medium transition-colors border-r border-b border-border/30 last:border-r-0 relative',
                isSelected ? 'bg-primary text-white' :
                isBlocked ? 'bg-red-100 text-red-400 cursor-not-allowed' :
                isTaken ? 'bg-amber-50 text-amber-600 cursor-not-allowed' :
                _isToday ? 'bg-primary/10 text-primary font-bold' :
                !isCurMonth || isPast ? 'text-muted-foreground/40 cursor-not-allowed' :
                'hover:bg-muted text-slate-700'
              )}
            >
              {date.getDate()}
              {(isBlocked || isTaken) && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-current opacity-60" />
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 px-3 py-2 border-t border-border bg-muted/10 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-100 border border-red-300" />Zablokowane</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-50 border border-amber-300" />Zajęte</span>
      </div>
    </div>
  )
}

// ─── Add reservation form (admin-simplified) ──────────────────────────────────

type ExtraItem = { type: ReservationExtraType; label: string; quantity: number; unitPrice: number }
type QtyMap = Record<string, number>

type AddForm = {
  date: Date | null
  startTime: string
  endTime: string
  adults: number
  children: number
  packageCode: PackageCode
  eventType: EventType
  total: string
  name: string
  phone: string
  email: string
  notes: string
  status: ReservationStatus
  extras: ExtraItem[]
}

type FullExtras = {
  coldPlate: QtyMap
  coldPlateSalad: QtyMap
  desserts: QtyMap
  softDrinks: QtyMap
  alcohol: QtyMap
  cakeOption: string
  soupChoice: string
  wantsSoup: boolean
  kidsMenu: number
  specialDiet: string
  wantsExtension: boolean
  extensionHours: number
  hallExclusivity: string
}

const EMPTY_FULL: FullExtras = {
  coldPlate: {}, coldPlateSalad: {}, desserts: {}, softDrinks: {}, alcohol: {},
  cakeOption: '', soupChoice: '', wantsSoup: false, kidsMenu: 0, specialDiet: '',
  wantsExtension: false, extensionHours: 1, hallExclusivity: '',
}

function buildExtras(full: FullExtras, packageCode: PackageCode): ExtraItem[] {
  const out: ExtraItem[] = []
  const addQty = (map: QtyMap, items: AdminItem[], type: ReservationExtraType, prefix = '') => {
    for (const item of items) {
      const qty = map[item.id] ?? 0
      if (qty > 0) out.push({ type, label: `${prefix}${item.title}`, quantity: qty, unitPrice: item.price })
    }
  }
  addQty(full.coldPlate, ADMIN_COLD_PLATE_SETS, 'COLD_PLATE')
  addQty(full.coldPlateSalad, ADMIN_COLD_PLATE_SALADS, 'COLD_PLATE')
  addQty(full.desserts, ADMIN_DESSERTS, 'DESSERTS')
  addQty(full.softDrinks, ADMIN_SOFT_DRINKS, 'DESSERTS', 'Napoje: ')
  addQty(full.alcohol, ADMIN_ALCOHOL, 'DESSERTS', 'Alkohol: ')
  if (full.cakeOption) {
    const label = CAKE_OPTIONS.find(o => o.value === full.cakeOption)?.label ?? full.cakeOption
    out.push({ type: 'CAKE', label, quantity: 1, unitPrice: 0 })
  }
  const showSoup = packageCode !== 'PLATINUM' || full.wantsSoup
  if (full.soupChoice && showSoup) {
    const soupLabel = SOUP_OPTIONS.find(o => o.value === full.soupChoice)?.label ?? full.soupChoice
    const soupPrice = packageCode === 'PLATINUM' ? 12 : 0
    out.push({ type: 'SPECIAL_DIET', label: `Zupa: ${soupLabel}`, quantity: 1, unitPrice: soupPrice })
  }
  if (full.kidsMenu > 0) {
    out.push({ type: 'KIDS_MENU', label: 'Danie dla dzieci', quantity: full.kidsMenu, unitPrice: 69 })
  }
  if (full.specialDiet.trim()) {
    out.push({ type: 'SPECIAL_DIET', label: `Dieta specjalna: ${full.specialDiet}`, quantity: 1, unitPrice: 0 })
  }
  if (full.hallExclusivity === 'yes') {
    out.push({ type: 'SPECIAL_DIET', label: 'Wyłączność sali', quantity: 1, unitPrice: 0 })
  }
  if (full.wantsExtension && full.extensionHours > 0) {
    const pricePerH = EXTENSION_PRICE[packageCode]
    out.push({ type: 'EXTENDED_TIME', label: `Przedłużenie ${full.extensionHours}h`, quantity: full.extensionHours, unitPrice: pricePerH })
  }
  return out
}

// ─── Items counter row ────────────────────────────────────────────────────────

const ItemRow = ({ item, qty, onChange }: { item: AdminItem; qty: number; onChange: (v: number) => void }) => (
  <div className={cn(
    'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
    qty > 0 ? 'border-primary/40 bg-primary/5' : 'border-border'
  )}>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-700 truncate">{item.title}</p>
      <p className="text-[10px] text-muted-foreground">{item.price} zł / {item.unit}</p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <button type="button"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onChange(Math.max(0, qty - 1))}
        className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors">
        <Minus size={11} />
      </button>
      <span className="w-6 text-center text-xs font-semibold tabular-nums">{qty}</span>
      <button type="button"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onChange(qty + 1)}
        className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors">
        <Plus size={11} />
      </button>
    </div>
    {qty > 0 && <span className="text-xs font-semibold text-primary tabular-nums shrink-0">{qty * item.price} zł</span>}
  </div>
)

// ─── Accordion section (form) ─────────────────────────────────────────────────

const AccSection = ({
  title, badge, isOpen, onToggle, children,
}: {
  title: string
  badge?: number
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
      <div className="flex items-center gap-2">
        {badge != null && badge > 0 && (
          <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <ChevronDown size={13} className={cn('text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </div>
    </button>
    {isOpen && (
      <div className="border-t border-border px-4 py-3 space-y-2">
        {children}
      </div>
    )}
  </div>
)

// ─── Add reservation dialog ───────────────────────────────────────────────────

const AddReservationDialog = ({
  open, initialDate, onClose, onSave, isSaving, blockedKeys = new Set<string>(), takenKeys = new Set<string>(),
}: {
  open: boolean
  initialDate: Date | null
  onClose: () => void
  onSave: (f: AddForm) => void
  isSaving: boolean
  blockedKeys?: Set<string>
  takenKeys?: Set<string>
}) => {
  const [f, setF] = useState<AddForm>({
    date: initialDate,
    startTime: '',
    endTime: '',
    adults: 20,
    children: 0,
    packageCode: 'SILVER',
    eventType: 'OTHER',
    total: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
    status: 'CONFIRMED',
    extras: [],
  })
  const [fullMode, setFullMode] = useState(false)
  const [full, setFull] = useState<FullExtras>(EMPTY_FULL)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const set = <K extends keyof AddForm>(key: K, val: AddForm[K]) =>
    setF((p) => ({ ...p, [key]: val }))
  const setQty = (section: keyof Pick<FullExtras, 'coldPlate' | 'coldPlateSalad' | 'desserts' | 'softDrinks' | 'alcohol'>) =>
    (id: string) => (qty: number) => setFull((p) => ({ ...p, [section]: { ...p[section], [id]: qty } }))
  const toggleSec = (id: string) => setOpenSections((p) => ({ ...p, [id]: !p[id] }))

  const extensionEndTime = useMemo(() => {
    if (!full.wantsExtension || !f.endTime) return null
    const [hh, mm] = f.endTime.split(':').map(Number)
    const total = hh * 60 + mm + full.extensionHours * 60
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }, [full.wantsExtension, full.extensionHours, f.endTime])

  const computedTotal = useMemo(() => {
    if (!fullMode) return null
    let t = PACKAGE_PRICE[f.packageCode] * f.adults
    if (f.packageCode === 'PLATINUM' && full.wantsSoup && full.soupChoice) t += 12 * f.adults
    t += buildExtras(full, f.packageCode).reduce((s, e) => s + e.quantity * e.unitPrice, 0)
    return t
  }, [fullMode, f.packageCode, f.adults, full])

  useEffect(() => {
    if (computedTotal !== null) setF((p) => ({ ...p, total: String(computedTotal) }))
  }, [computedTotal])

  const qtyCount = (map: QtyMap) => Object.values(map).filter((v) => v > 0).length
  const badges = {
    pakiet: f.packageCode ? 1 : 0,
    'zimna-plyta': qtyCount(full.coldPlate) + qtyCount(full.coldPlateSalad),
    desery: qtyCount(full.desserts),
    tort: full.cakeOption ? 1 : 0,
    napoje: qtyCount(full.softDrinks),
    alkohol: qtyCount(full.alcohol),
    dodatki: (full.kidsMenu > 0 ? 1 : 0) + (full.specialDiet.trim() ? 1 : 0),
    przedluzenie: full.wantsExtension ? 1 : 0,
    wylacznosc: full.hallExclusivity === 'yes' ? 1 : 0,
  }

  const valid = f.date && f.adults >= 1 && f.name.trim() && f.phone.trim()
  const handleSave = () => {
    const extras = fullMode ? buildExtras(full, f.packageCode) : []
    onSave({ ...f, extras })
  }

  const Label = ({ text }: { text: string }) => (
    <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">{text}</p>
  )
  const extPrice = EXTENSION_PRICE[f.packageCode]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-5 pb-4 shrink-0 border-b border-border">
          <DialogTitle className="font-sans font-semibold text-slate-800">Nowa rezerwacja</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* DATE */}
          <div>
            <Label text="Data" />
            <MiniCalendar value={f.date} onChange={(d) => set('date', d)} blockedKeys={blockedKeys} takenKeys={takenKeys} />
            {f.date && (
              <p className="text-sm font-medium text-primary text-center mt-2">
                {format(f.date, 'EEEE, d MMMM yyyy', { locale: pl })}
              </p>
            )}
          </div>

          {/* HOURS */}
          <div>
            <Label text="Godziny" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rozpoczęcie</label>
                <Select value={f.startTime} onValueChange={(v) => set('startTime', v)}>
                  <SelectTrigger><SelectValue placeholder="Wybierz…" /></SelectTrigger>
                  <SelectContent>{TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zakończenie</label>
                <Select value={f.endTime} onValueChange={(v) => set('endTime', v)}>
                  <SelectTrigger><SelectValue placeholder="Wybierz…" /></SelectTrigger>
                  <SelectContent>{TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* GUESTS */}
          <div>
            <Label text="Goście" />
            <div className="flex gap-8">
              <Counter label="Dorośli" value={f.adults} min={1} onChange={(v) => set('adults', v)} />
              <Counter label="Dzieci" value={f.children} onChange={(v) => set('children', v)} />
            </div>
          </div>

          {/* EVENT TYPE */}
          <div>
            <Label text="Typ wydarzenia" />
            <Select value={f.eventType} onValueChange={(v) => set('eventType', v as EventType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabelMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* STATUS */}
          <div>
            <Label text="Status" />
            <Select value={f.status} onValueChange={(v) => set('status', v as ReservationStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SENT">Nowe</SelectItem>
                <SelectItem value="CONFIRMED">Potwierdzone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CONTACT */}
          <div>
            <Label text="Kontakt" />
            <div className="space-y-2">
              <Input placeholder="Imię i nazwisko *" value={f.name} onChange={(e) => set('name', e.target.value)} />
              <Input placeholder="Telefon *" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
              <Input placeholder="E-mail" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
              <Textarea placeholder="Uwagi" value={f.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
            </div>
          </div>

          {/* PACKAGE */}
          <div>
            <Label text="Pakiet" />
            <div className="grid grid-cols-3 gap-2">
              {PACKAGES.map((pkg) => (
                <button key={pkg.code} type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => set('packageCode', pkg.code)}
                  className={cn(
                    'flex flex-col items-center py-3 rounded-xl border-2 text-xs font-semibold transition-colors',
                    f.packageCode === pkg.code
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-slate-500 hover:border-primary/40'
                  )}
                >
                  <span className="text-sm font-bold">{pkg.label}</span>
                  <span className="text-[10px] font-normal mt-0.5 text-current opacity-60">{PACKAGE_PRICE[pkg.code]} zł/os</span>
                </button>
              ))}
            </div>
          </div>

          {/* TOTAL */}
          <div>
            <Label text="Łączna kwota" />
            <Input
              type="number"
              placeholder="np. 4500"
              value={f.total}
              onChange={(e) => set('total', e.target.value)}
            />
          </div>

          {/* FULL MODE toggle */}
          <button type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setFullMode((p) => !p)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-xs text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <Plus size={12} className={cn('transition-transform', fullMode && 'rotate-45')} />
            {fullMode ? 'Ukryj szczegóły menu' : 'Dodaj szczegóły menu'}
          </button>

          {fullMode && (
            <div className="space-y-2">
              {/* 1. PAKIET */}
              <AccSection title="Pakiet" badge={badges.pakiet} isOpen={!!openSections['pakiet']} onToggle={() => toggleSec('pakiet')}>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {PACKAGES.map((pkg) => (
                    <div key={pkg.code} className={cn('flex justify-between px-2 py-1 rounded', f.packageCode === pkg.code && 'bg-primary/5 text-primary font-medium')}>
                      <span>{pkg.label} — {pkg.desc}</span>
                      <span>{PACKAGE_PRICE[pkg.code]} zł / os.</span>
                    </div>
                  ))}
                </div>
              </AccSection>

              {/* 2. ZIMNA PŁYTA */}
              <AccSection title="Zimna płyta" badge={badges['zimna-plyta']} isOpen={!!openSections['zimna-plyta']} onToggle={() => toggleSec('zimna-plyta')}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sety</p>
                <div className="space-y-1.5">
                  {ADMIN_COLD_PLATE_SETS.map((item) => (
                    <ItemRow key={item.id} item={item} qty={full.coldPlate[item.id] ?? 0} onChange={setQty('coldPlate')(item.id)} />
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3 mb-1">Sałatki</p>
                <div className="space-y-1.5">
                  {ADMIN_COLD_PLATE_SALADS.map((item) => (
                    <ItemRow key={item.id} item={item} qty={full.coldPlateSalad[item.id] ?? 0} onChange={setQty('coldPlateSalad')(item.id)} />
                  ))}
                </div>
              </AccSection>

              {/* 3. DESERY */}
              <AccSection title="Desery" badge={badges.desery} isOpen={!!openSections['desery']} onToggle={() => toggleSec('desery')}>
                <div className="space-y-1.5">
                  {ADMIN_DESSERTS.map((item) => (
                    <ItemRow key={item.id} item={item} qty={full.desserts[item.id] ?? 0} onChange={setQty('desserts')(item.id)} />
                  ))}
                </div>
              </AccSection>

              {/* 4. TORT */}
              <AccSection title="Tort" badge={badges.tort} isOpen={!!openSections['tort']} onToggle={() => toggleSec('tort')}>
                <div className="space-y-1.5">
                  {CAKE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                      <input type="radio" className="accent-primary"
                        checked={full.cakeOption === opt.value}
                        onChange={() => setFull((p) => ({ ...p, cakeOption: opt.value }))} />
                      <span className="text-xs font-medium text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </AccSection>

              {/* 5. ZUPA */}
              <AccSection title={f.packageCode === 'PLATINUM' ? 'Zupa (opcjonalna, +12 zł/os.)' : 'Zupa'} isOpen={!!openSections['zupa']} onToggle={() => toggleSec('zupa')}>
                {f.packageCode === 'PLATINUM' && (
                  <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors mb-1.5">
                    <input type="checkbox" className="h-4 w-4 accent-primary"
                      checked={full.wantsSoup}
                      onChange={(e) => setFull((p) => ({ ...p, wantsSoup: e.target.checked }))} />
                    <span className="text-xs font-medium text-slate-700">Chcę zupę (+12 zł / os.)</span>
                  </label>
                )}
                {(f.packageCode !== 'PLATINUM' || full.wantsSoup) && (
                  <div className="space-y-1.5">
                    {SOUP_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                        <input type="radio" className="accent-primary"
                          checked={full.soupChoice === opt.value}
                          onChange={() => setFull((p) => ({ ...p, soupChoice: opt.value }))} />
                        <span className="text-xs font-medium text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </AccSection>

              {/* 6. NAPOJE */}
              <AccSection title="Napoje bezalkoholowe" badge={badges.napoje} isOpen={!!openSections['napoje']} onToggle={() => toggleSec('napoje')}>
                <div className="space-y-1.5">
                  {ADMIN_SOFT_DRINKS.map((item) => (
                    <ItemRow key={item.id} item={item} qty={full.softDrinks[item.id] ?? 0} onChange={setQty('softDrinks')(item.id)} />
                  ))}
                </div>
              </AccSection>

              {/* 7. ALKOHOL */}
              <AccSection title="Alkohol" badge={badges.alkohol} isOpen={!!openSections['alkohol']} onToggle={() => toggleSec('alkohol')}>
                <div className="space-y-1.5">
                  {ADMIN_ALCOHOL.map((item) => (
                    <ItemRow key={item.id} item={item} qty={full.alcohol[item.id] ?? 0} onChange={setQty('alcohol')(item.id)} />
                  ))}
                </div>
              </AccSection>

              {/* 8. DODATKI */}
              <AccSection title="Dodatki" badge={badges.dodatki} isOpen={!!openSections['dodatki']} onToggle={() => toggleSec('dodatki')}>
                <Counter label="Menu dla dzieci (69 zł/szt.)" value={full.kidsMenu} onChange={(v) => setFull((p) => ({ ...p, kidsMenu: v }))} />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Dieta specjalna</p>
                  <Textarea placeholder="np. wegetariańska, alergie…" value={full.specialDiet}
                    onChange={(e) => setFull((p) => ({ ...p, specialDiet: e.target.value }))} rows={2} />
                </div>
              </AccSection>

              {/* 9. PRZEDŁUŻENIE */}
              <AccSection title="Przedłużenie sali" badge={badges.przedluzenie} isOpen={!!openSections['przedluzenie']} onToggle={() => toggleSec('przedluzenie')}>
                <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input type="checkbox" className="h-4 w-4 accent-primary"
                    checked={full.wantsExtension}
                    onChange={(e) => setFull((p) => ({ ...p, wantsExtension: e.target.checked }))} />
                  <span className="text-xs font-medium text-slate-700 flex-1">Przedłuż przyjęcie</span>
                  <span className="text-[10px] text-muted-foreground">{extPrice} zł / h</span>
                </label>
                {full.wantsExtension && (
                  <div className="space-y-2 mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Liczba godzin</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((h) => {
                        const endT = (() => {
                          if (!f.endTime) return null
                          const [hh, mm] = f.endTime.split(':').map(Number)
                          const total = hh * 60 + mm + h * 60
                          return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                        })()
                        return (
                          <button key={h} type="button"
                            onPointerDown={(e) => e.preventDefault()}
                            onClick={() => setFull((p) => ({ ...p, extensionHours: h }))}
                            className={cn(
                              'flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-colors text-center',
                              full.extensionHours === h
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-slate-500 hover:border-primary/40'
                            )}>
                            <span className="block">{h}h</span>
                            {endT && <span className="block text-[9px] font-normal mt-0.5">do {endT}</span>}
                            <span className="block text-[9px] font-normal">{h * extPrice} zł</span>
                          </button>
                        )
                      })}
                    </div>
                    {extensionEndTime && (
                      <p className="text-xs text-primary font-medium">Przyjęcie potrwa do {extensionEndTime}</p>
                    )}
                  </div>
                )}
              </AccSection>

              {/* 10. WYŁĄCZNOŚĆ SALI */}
              <AccSection title="Wyłączność sali" badge={badges.wylacznosc} isOpen={!!openSections['wylacznosc']} onToggle={() => toggleSec('wylacznosc')}>
                <p className="text-xs text-muted-foreground">Przy przyjęciach do 35 osób sala nie jest zamykana standardowo. Wyłączność sali jest wyceniana indywidualnie.</p>
                <div className="flex gap-2 mt-2">
                  {[{ value: 'no', label: 'Bez wyłączności' }, { value: 'yes', label: 'Chce wyłączność' }].map((opt) => (
                    <button key={opt.value} type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => setFull((p) => ({ ...p, hallExclusivity: p.hallExclusivity === opt.value ? '' : opt.value }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-colors',
                        full.hallExclusivity === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </AccSection>

              {/* PRICE SUMMARY */}
              {computedTotal !== null && (
                <div className="rounded-xl border border-border overflow-hidden mt-4">
                  <div className="px-4 py-2.5 bg-muted/20 border-b border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Podsumowanie ceny</p>
                  </div>
                  <div className="px-4 py-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Pakiet {f.packageCode} ({f.adults} os.)</span>
                      <span className="font-medium">{PACKAGE_PRICE[f.packageCode] * f.adults} zł</span>
                    </div>
                    {f.packageCode === 'PLATINUM' && full.wantsSoup && full.soupChoice && (
                      <div className="flex justify-between">
                        <span>Zupa (+12 zł / os.)</span>
                        <span className="font-medium">{12 * f.adults} zł</span>
                      </div>
                    )}
                    {buildExtras(full, f.packageCode).filter(e => e.unitPrice > 0).map((e, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate max-w-[200px]">{e.label} ×{e.quantity}</span>
                        <span className="font-medium shrink-0 ml-2">{e.quantity * e.unitPrice} zł</span>
                      </div>
                    ))}
                    {full.hallExclusivity === 'yes' && (
                      <div className="flex justify-between text-slate-400">
                        <span>Wyłączność sali</span>
                        <span className="italic">wycena indywidualna</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-800 border-t border-border pt-2 mt-1">
                      <span>Razem</span>
                      <span>{computedTotal} zł</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <Button className="w-full" disabled={!valid || isSaving} onClick={handleSave}>
            {isSaving ? 'Zapisywanie…' : 'Zapisz rezerwację'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main calendar (left panel) — minimalist style ───────────────────────────

const MainCalendar = ({
  month,
  onMonthChange,
  selectedDate,
  onDayClick,
  reservationsByDate,
  blockedByDate,
}: {
  month: Date
  onMonthChange: (m: Date) => void
  selectedDate: Date | null
  onDayClick: (d: Date) => void
  reservationsByDate: Map<string, ReservationListItem[]>
  blockedByDate: Map<string, { id: string; notes: string | null }>
}) => {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-1 lg:min-h-0">
      {/* Month header */}
      <div className="grid grid-cols-[40px_1fr_40px] items-center px-7 pt-7 pb-6">
        <button
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-700"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft size={22} strokeWidth={1.8} />
        </button>
        <h2 className="text-center text-2xl md:text-3xl font-normal text-slate-950 uppercase tracking-[0.08em]">
          {format(month, 'LLLL yyyy', { locale: pl }).toUpperCase()}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-700"
          aria-label="Następny miesiąc"
        >
          <ChevronRight size={22} strokeWidth={1.8} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 px-5 pb-3">
        {WEEKDAYS_FULL.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-5 pb-5 auto-rows-[72px] gap-y-1 lg:flex-1 lg:auto-rows-fr">
        {days.map((date) => {
          const key = toDateKey(date)
          const blocked = blockedByDate.get(key)
          const reservations = reservationsByDate.get(key) ?? []
          const active = reservations.filter((r) => r.status !== 'DRAFT')
          const isCurMonth = isSameMonth(date, month)
          const _isToday = isToday(date)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false

          // Block color per status for event pills
          const pillBg: Record<ReservationStatus, string> = {
            SENT:      'bg-amber-100 text-amber-800',
            CONFIRMED: 'bg-emerald-100 text-emerald-800',
            CANCELLED: 'bg-slate-100 text-slate-500',
            DRAFT:     'bg-slate-50 text-slate-400',
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(date)}
              className={cn(
                'relative flex flex-col items-center p-1.5 gap-1 rounded-2xl transition-colors text-center min-h-[72px]',
                isSelected ? 'bg-slate-100 ring-1 ring-inset ring-slate-200' : 'hover:bg-slate-50',
                !isCurMonth && 'opacity-30',
              )}
            >
              {/* Day number */}
              <span className={cn(
                'flex items-center justify-center h-7 w-7 rounded-full text-sm font-medium shrink-0',
                isSelected
                  ? 'bg-slate-900 text-white'
                  : _isToday
                    ? 'bg-slate-800 text-white'
                    : blocked
                      ? 'text-red-400'
                      : 'text-slate-700',
              )}>
                {date.getDate()}
              </span>

              {/* LARGE screens: event pills with time */}
              {!blocked && (
                <div className="hidden lg:flex flex-col gap-1 w-full">
                  {active.slice(0, 3).map((r) => (
                    <span key={r.id} className={cn(
                      'w-full truncate rounded-md px-1.5 py-1 text-[10px] font-semibold leading-tight',
                      isSelected
                        ? r.status === 'SENT' ? 'bg-amber-100 text-amber-900'
                          : r.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-slate-200 text-slate-600'
                        : pillBg[r.status],
                    )}>
                      {(r.startTime || r.endTime) && (
                        <span className="opacity-70 mr-0.5">
                          {r.startTime && r.endTime
                            ? `${r.startTime}-${r.endTime}`
                            : r.startTime ?? r.endTime}
                        </span>
                      )}
                      {r.contact?.name ?? '—'}
                    </span>
                  ))}
                  {active.length > 3 && (
                    <span className="text-[9px] text-slate-400 px-1">+{active.length - 3}</span>
                  )}
                </div>
              )}
              {blocked && (
                <span className="hidden lg:block w-full truncate rounded-md px-1.5 py-1 text-[10px] font-semibold bg-red-100 text-red-500 leading-tight">
                  Zablokowane
                </span>
              )}

              {/* SMALL screens: dots only */}
              <div className="flex lg:hidden justify-center gap-[3px] px-0.5">
                {blocked ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
                ) : (
                  active.slice(0, 4).map((r) => (
                    <span key={r.id} className={cn('h-1.5 w-1.5 rounded-full shrink-0', DOT_COLOR[r.status])} />
                  ))
                )}
                {!blocked && active.length > 4 && (
                  <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-slate-200" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 px-6 py-4 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Nowe
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Potwierdzone
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-300" />Zablokowane
        </span>
      </div>
    </div>
  )
}

// ─── Reservation card (accordion) ────────────────────────────────────────────

const ReservationCard = ({
  res,
  isExpanded,
  detail,
  onExpand,
  onConfirm,
  onCancel,
  onDelete,
}: {
  res: ReservationListItem
  isExpanded: boolean
  detail: ReservationDetail | null
  onExpand: () => void
  onConfirm: () => void
  onCancel: () => void
  onDelete: () => void
}) => {
  const statusBg: Record<ReservationStatus, string> = {
    SENT:      'bg-amber-50 border-amber-200',
    CONFIRMED: 'bg-emerald-50 border-emerald-200',
    CANCELLED: 'bg-slate-50 border-slate-200',
    DRAFT:     'bg-slate-50 border-slate-100',
  }
  const dietaryNotes = detail?.extras
    ?.filter((extra) => extra.type === 'SPECIAL_DIET' && extra.label.startsWith('Dieta specjalna'))
    .map((extra) => extra.label.replace(/^Dieta specjalna(?: - szczegóły)?:\s*/i, '').trim())
    .filter(Boolean) ?? []

  return (
    <div className={cn('rounded-xl border overflow-hidden transition-shadow', statusBg[res.status], isExpanded && 'shadow-sm')}>
      {/* Card header — click to expand */}
      <button
        type="button"
        onClick={onExpand}
        className="w-full flex items-start gap-2 px-3 py-3 text-left hover:brightness-95 transition-all sm:gap-3 sm:px-4"
      >
        {/* Status dot */}
        <span className={cn('h-2.5 w-2.5 rounded-full mt-1 shrink-0', DOT_COLOR[res.status])} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{res.contact?.name ?? '—'}</p>
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', statusBadgeMap[res.status])}>
              {statusLabelMap[res.status]}
            </span>
          </div>
          <div className="flex items-center gap-x-3 gap-y-1 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar size={10} className="shrink-0" />
              {formatDate(res.eventDate)}
            </span>
            {(res.startTime || res.endTime) && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={10} className="shrink-0" />
                {res.startTime}{res.startTime && res.endTime ? ` – ${res.endTime}` : res.endTime}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Users size={10} className="shrink-0" />
              {res.adultsCount}{res.childrenCount ? ` + ${res.childrenCount}` : ''}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1 pl-1">
          {res.offerSnapshot?.total != null && (
            <span className="text-sm font-bold text-slate-800">{res.offerSnapshot.total} zł</span>
          )}
          {res.offerSnapshot?.packageCode && (
            <span className="text-[10px] text-slate-400">{packageLabelMap[res.offerSnapshot.packageCode]}</span>
          )}
          <ChevronDown size={13} className={cn('text-slate-400 transition-transform duration-200 mt-0.5', isExpanded && 'rotate-180')} />
        </div>
      </button>

      {/* Expanded — full offer summary document */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {/* Document container */}
          <div className="bg-white mx-3 my-3 rounded-xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Doc body */}
            <div className="divide-y divide-slate-50">

              {/* Contact */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Dane kontaktowe</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Imię i nazwisko</p>
                    <p className="text-sm font-medium text-slate-800">{detail?.contact?.name ?? res.contact?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Telefon</p>
                    {detail?.contact?.phone ? (
                      <a href={`tel:${detail.contact.phone}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        <Phone size={11} />{detail.contact.phone}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-800">{res.contact?.phone ?? '—'}</p>
                    )}
                  </div>
                  {detail?.contact?.email && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 mb-0.5">E-mail</p>
                      <a href={`mailto:${detail.contact.email}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        <Mail size={11} />{detail.contact.email}
                      </a>
                    </div>
                  )}
                  {detail?.contact?.notes && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 mb-0.5">Uwagi klienta</p>
                      <p className="text-sm text-slate-600 italic">{detail.contact.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event details */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Szczegóły wydarzenia</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Typ</p>
                    <p className="text-sm font-medium text-slate-800">{eventTypeLabelMap[res.eventType] ?? res.eventType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Liczba gości</p>
                    <p className="text-sm font-medium text-slate-800">
                      {res.adultsCount} dorosłych{res.childrenCount ? ` + ${res.childrenCount} dzieci` : ''}
                    </p>
                  </div>
                  {detail?.offerSnapshot?.packageCode && (
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5">Pakiet</p>
                      <p className="text-sm font-medium text-slate-800">{packageLabelMap[detail.offerSnapshot.packageCode]}</p>
                    </div>
                  )}
                  {detail?.offerSnapshot?.durationHours && (
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5">Czas trwania</p>
                      <p className="text-sm font-medium text-slate-800">{detail.offerSnapshot.durationHours} godziny</p>
                    </div>
                  )}
                  {dietaryNotes.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 mb-0.5">Uwagi żywieniowe</p>
                      <p className="text-sm font-medium text-slate-800">{dietaryNotes.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing breakdown */}
              {detail?.offerSnapshot && (
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Wycena</p>
                  <div className="space-y-2">
                    {/* Base package */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        Pakiet {packageLabelMap[detail.offerSnapshot.packageCode]} × {res.adultsCount} os.
                      </span>
                      <span className="text-sm font-medium text-slate-800">{detail.offerSnapshot.subtotal} zł</span>
                    </div>

                    {/* Extras */}
                    {detail.extras && detail.extras.length > 0 && detail.extras.map((e, i) => (
                      <div key={i} className="flex items-start justify-between gap-3">
                        <span className="text-sm text-slate-500 flex-1">{e.label}{e.quantity > 1 ? ` ×${e.quantity}` : ''}</span>
                        {e.unitPrice > 0
                          ? <span className="text-sm font-medium text-slate-800 shrink-0">{e.quantity * e.unitPrice} zł</span>
                          : <span className="text-xs text-slate-400 shrink-0 italic">w cenie</span>
                        }
                      </div>
                    ))}

                    {/* Service fee */}
                    {detail.offerSnapshot.serviceFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Serwis</span>
                        <span className="text-sm font-medium text-slate-800">+{detail.offerSnapshot.serviceFee} zł</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
                      <span className="text-sm font-bold text-slate-900">Razem</span>
                      <span className="text-lg font-bold text-slate-900">{detail.offerSnapshot.total} zł</span>
                    </div>
                  </div>
                </div>
              )}

              {/* No offer snapshot yet — show basic extras if any */}
              {!detail?.offerSnapshot && detail?.extras && detail.extras.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Dodatki</p>
                  <div className="space-y-1.5">
                    {detail.extras.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{e.label}{e.quantity > 1 ? ` ×${e.quantity}` : ''}</span>
                        {e.unitPrice > 0 && <span className="font-medium text-slate-800">{e.quantity * e.unitPrice} zł</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions bar */}
          <div className="px-4 pb-3 flex items-center gap-3">
            {res.status === 'SENT' && (
              <Button size="sm" onClick={onConfirm} className="h-7 text-xs">Potwierdź rezerwację</Button>
            )}
            {detail?.summaryPdf && (
              <a
                href={`/api/reservations/${res.id}/summary-pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
              >
                <FileText size={12} /> PDF oferty
              </a>
            )}
            {(res.status === 'SENT' || res.status === 'CONFIRMED') && (
              <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors">
                <X size={12} /> Anuluj
              </button>
            )}
            <button onClick={onDelete} className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={12} /> Usuń
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Reservations = () => {
  const { status: sessionStatus } = useSession()
  const enabled = sessionStatus === 'authenticated'

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('new')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: 'confirm' | 'cancel' } | null>(null)

  const { data: reservations, isLoading, refetch } = trpc.reservations.getReservationsList.useQuery({}, { enabled })
  const { data: blockedDates, refetch: refetchBlocked } = trpc.reservations.getBlockedDates.useQuery(undefined, { enabled })
  const { data: detail } = trpc.reservations.getReservationById.useQuery(
    { id: expandedId! }, { enabled: !!expandedId && enabled }
  )

  const createReservation = trpc.reservations.createReservation.useMutation({
    onSuccess: () => { void refetch(); setAddOpen(false) },
  })
  const deleteReservation = trpc.reservations.deleteReservation.useMutation({
    onSuccess: () => { void refetch(); setDeleteId(null) },
  })
  const updateStatus = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => { void refetch(); setConfirmDialog(null) },
  })
  const upsertBlocked = trpc.reservations.upsertBlockedDate.useMutation({
    onSuccess: () => void refetchBlocked(),
  })
  const deleteBlocked = trpc.reservations.deleteBlockedDate.useMutation({
    onSuccess: () => void refetchBlocked(),
  })

  useAdminRealtime({
    onReservationsChanged: () => {
      void refetch()
      void refetchBlocked()
    },
  }, enabled)

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationListItem[]>()
    for (const r of reservations ?? []) {
      const key = toDateKey(new Date(r.eventDate))
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return map
  }, [reservations])

  const blockedByDate = useMemo(() => {
    const map = new Map<string, { id: string; notes: string | null }>()
    for (const b of blockedDates ?? []) {
      if (b.isBlocked) map.set(toDateKey(new Date(b.date)), { id: b.id, notes: b.notes })
    }
    return map
  }, [blockedDates])

  const blockedDateKeys = useMemo(() => {
    const s = new Set<string>()
    for (const [k] of blockedByDate) s.add(k)
    return s
  }, [blockedByDate])

  const takenDateKeys = useMemo(() => {
    const s = new Set<string>()
    for (const [k, rs] of reservationsByDate) {
      if (rs.some((r) => r.status === 'CONFIRMED' || r.status === 'SENT')) s.add(k)
    }
    return s
  }, [reservationsByDate])

  const selectedBlocked = selectedDate ? blockedByDate.get(toDateKey(selectedDate)) : undefined

  // Filtered list for right panel
  const currentTab = TABS.find((t) => t.value === activeTab)!
  const filteredReservations = useMemo(() => {
    return (reservations ?? []).filter((r) => {
      const tabMatch = currentTab.statuses.includes(r.status)
      const dateMatch = selectedDate
        ? isSameDay(new Date(r.eventDate), selectedDate)
        : true
      return tabMatch && dateMatch
    })
  }, [reservations, currentTab, selectedDate])

  const tabCount = (tab: typeof TABS[number]) => {
    const base = (reservations ?? []).filter((r) => tab.statuses.includes(r.status))
    if (!selectedDate) return base.length
    return base.filter((r) => isSameDay(new Date(r.eventDate), selectedDate)).length
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate((prev) => prev && isSameDay(prev, date) ? null : date)
    setExpandedId(null)
  }

  const handleAddSave = (f: AddForm) => {
    if (!f.date) return
    createReservation.mutate({
      eventDate: toDateKey(f.date),
      startTime: f.startTime || null,
      endTime: f.endTime || null,
      adultsCount: f.adults,
      childrenCount: f.children,
      eventType: f.eventType,
      status: f.status,
      contact: {
        name: f.name,
        phone: f.phone,
        email: f.email || `${f.phone}@noemail.local`,
        notes: f.notes || null,
      },
      packageCode: f.packageCode,
      total: f.total ? Number(f.total) : null,
      extras: f.extras,
    })
  }

  const actionsNode = (
    <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 gap-1.5">
      <Plus size={13} /> Dodaj rezerwację
    </Button>
  )

  if (isLoading) {
    return (
      <>
        <div className="sticky top-0 z-20 bg-white border-b border-border h-14" />
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Rezerwacje" actions={actionsNode} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:min-h-0">
        <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-5 lg:h-full lg:min-h-0">

          {/* ── LEFT: Calendar (2/3) ───────────────────────────── */}
          <div className="flex flex-col gap-3 lg:min-h-0">
            <MainCalendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              reservationsByDate={reservationsByDate}
              blockedByDate={blockedByDate}
            />

            {/* Selected day actions panel */}
            {selectedDate && (
              <div className="shrink-0 rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-xs font-semibold text-slate-600 capitalize lg:min-w-[180px]">
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl })}
                  </p>

                  {/* Add reservation */}
                  <div className="flex flex-col gap-2 lg:flex-1 lg:flex-row lg:items-center lg:justify-end">
                    <Button
                      size="sm"
                      className="w-full h-8 gap-1.5 text-xs lg:w-auto lg:min-w-[220px]"
                      onClick={() => setAddOpen(true)}
                    >
                      <Plus size={12} /> Dodaj rezerwację na ten dzień
                    </Button>

                    {/* Block / unblock */}
                    {selectedBlocked ? (
                      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 lg:max-w-[360px]">
                        <Lock size={13} className="text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-600">Dzień zablokowany</p>
                          {selectedBlocked.notes && (
                            <p className="text-[10px] text-slate-400 truncate">{selectedBlocked.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteBlocked.mutate({ id: selectedBlocked.id })}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                        >
                          <LockOpen size={12} /> Odblokuj
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => upsertBlocked.mutate({ date: toDateKey(selectedDate), isBlocked: true, notes: 'Termin zajęty' })}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 border border-dashed border-border rounded-lg px-3 py-2 transition-colors lg:w-auto lg:min-w-[180px]"
                      >
                        <Lock size={11} /> Zablokuj ten dzień
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Tabbed reservation list (1/3) ──────────── */}
          <div className="flex flex-col lg:min-h-0">
            <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col lg:flex-1 lg:min-h-0 overflow-hidden">

              {/* Tab bar */}
              <div className="grid grid-cols-3 border-b border-border px-3 shrink-0 sm:px-4">
                {TABS.map((tab) => {
                  const count = tabCount(tab)
                  const isActive = activeTab === tab.value
                  return (
                    <button
                      key={tab.value}
                      onClick={() => { setActiveTab(tab.value); setExpandedId(null) }}
                      className={cn(
                        'flex min-w-0 items-center justify-center gap-1.5 h-12 px-1 text-sm font-medium border-b-2 transition-all -mb-px sm:gap-2 sm:px-3',
                        isActive
                          ? 'border-primary text-slate-800'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      )}
                    >
                      <span className="truncate">{tab.label}</span>
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold',
                        isActive ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-500'
                      )}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-primary/5 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                      Wybrany dzień
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary/80"
                    aria-label="Wyczyść wybrany dzień"
                  >
                    <X size={12} />
                    <span className="hidden sm:inline">Wyczyść</span>
                  </button>
                </div>
              )}

              {/* List */}
              <div className="p-3 space-y-2 sm:p-4 lg:flex-1 lg:overflow-y-auto">
                {filteredReservations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <Calendar size={36} strokeWidth={1} className="mb-3" />
                    <p className="text-sm">Brak rezerwacji</p>
                    {selectedDate && (
                      <p className="text-xs mt-1 text-slate-300">
                        {format(selectedDate, 'd MMMM yyyy', { locale: pl })}
                      </p>
                    )}
                  </div>
                ) : (
                  filteredReservations.map((res) => (
                    <ReservationCard
                      key={res.id}
                      res={res}
                      isExpanded={expandedId === res.id}
                      detail={expandedId === res.id ? detail ?? null : null}
                      onExpand={() => setExpandedId((p) => p === res.id ? null : res.id)}
                      onConfirm={() => setConfirmDialog({ id: res.id, action: 'confirm' })}
                      onCancel={() => setConfirmDialog({ id: res.id, action: 'cancel' })}
                      onDelete={() => setDeleteId(res.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add dialog */}
      <AddReservationDialog
        open={addOpen}
        initialDate={selectedDate}
        onClose={() => setAddOpen(false)}
        onSave={handleAddSave}
        isSaving={createReservation.isLoading}
        blockedKeys={blockedDateKeys}
        takenKeys={takenDateKeys}
      />

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <ConfirmDialogContent className="rounded-2xl">
          <ConfirmDialogHeader>
            <ConfirmDialogTitle className="font-semibold text-slate-800">Usuń rezerwację?</ConfirmDialogTitle>
            <DialogDescription className="text-slate-500">Operacja jest nieodwracalna.</DialogDescription>
          </ConfirmDialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Wróć</Button>
            <Button variant="destructive" size="sm" disabled={deleteReservation.isLoading}
              onClick={() => deleteId && deleteReservation.mutate({ id: deleteId })}>
              {deleteReservation.isLoading ? 'Usuwanie…' : 'Usuń'}
            </Button>
          </DialogFooter>
        </ConfirmDialogContent>
      </ConfirmDialog>

      {/* Status confirm */}
      <ConfirmDialog open={!!confirmDialog} onOpenChange={(o) => !o && setConfirmDialog(null)}>
        <ConfirmDialogContent className="rounded-2xl">
          <ConfirmDialogHeader>
            <ConfirmDialogTitle className="font-semibold text-slate-800">
              {confirmDialog?.action === 'confirm' ? 'Potwierdzić rezerwację?' : 'Anulować rezerwację?'}
            </ConfirmDialogTitle>
            <DialogDescription className="text-slate-500">
              {confirmDialog?.action === 'confirm'
                ? 'Status zmieni się na Potwierdzone.'
                : 'Status zmieni się na Anulowane.'}
            </DialogDescription>
          </ConfirmDialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmDialog(null)}>Wróć</Button>
            <Button
              variant={confirmDialog?.action === 'cancel' ? 'destructive' : 'default'}
              size="sm"
              disabled={updateStatus.isLoading}
              onClick={() => confirmDialog && updateStatus.mutate({
                id: confirmDialog.id,
                status: confirmDialog.action === 'confirm' ? 'CONFIRMED' : 'CANCELLED',
              })}
            >
              {updateStatus.isLoading
                ? 'Zapisywanie…'
                : confirmDialog?.action === 'confirm' ? 'Potwierdź' : 'Anuluj'}
            </Button>
          </DialogFooter>
        </ConfirmDialogContent>
      </ConfirmDialog>
    </>
  )
}

export default Reservations
