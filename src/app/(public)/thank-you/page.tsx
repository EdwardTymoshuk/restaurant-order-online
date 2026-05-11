'use client'

import OrderTrackingDialog from '@/app/components/OrderTrackingDialog'
import { Button } from '@/app/components/ui/button'
import { useOrder } from '@/app/context/OrderContext'
import { formatDate } from '@/utils/formateDate'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Phone,
  ReceiptText,
  Search,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

const ThankYouPage = () => {
  const router = useRouter()
  const { orderId, phoneNumber, clientName, deliveryMethod, deliveryTime } =
    useOrder()
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false)

  const displayOrderId = useMemo(() => {
    if (!orderId) return 'Brak numeru'
    if (orderId.length <= 18) return orderId
    return `${orderId.slice(0, 8)}...${orderId.slice(-6)}`
  }, [orderId])

  const methodLabel =
    deliveryMethod === 'DELIVERY'
      ? 'Dostawa'
      : deliveryMethod === 'TAKE_OUT'
        ? 'Odbiór'
        : 'Nieznany'
  const timeLabel = deliveryMethod === 'DELIVERY' ? 'dostawy' : 'odbioru'

  return (
    <main className="min-h-[calc(100vh-48px)] w-full bg-[#f6f7f8]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-secondary">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/img/main-page.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,48,124,0.96)_0%,rgba(18,48,124,0.86)_52%,rgba(18,48,124,0.62)_100%)]" />

        <div className="relative mx-auto flex min-h-[260px] w-full max-w-7xl flex-col justify-center px-4 py-10 lg:px-8">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-secondary shadow-lg shadow-primary/20">
            <CheckCircle2 size={30} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Zamówienie przyjęte
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight text-white md:text-6xl">
            Dziękujemy za zamówienie.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/75">
            Potwierdzenie zostało zapisane. Możesz wrócić do menu albo sprawdzić
            aktualny status zamówienia po numerze telefonu.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Szczegóły
              </span>
              <h2 className="mt-1 font-serif text-3xl font-bold text-secondary">
                Podsumowanie zamówienia
              </h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-secondary">
              <ReceiptText size={16} />
              {displayOrderId}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <InfoTile
              icon={<ShoppingBag size={20} />}
              label="Numer zamówienia"
              value={orderId || 'Brak danych zamówienia'}
              mono
            />
            <InfoTile
              icon={<Phone size={20} />}
              label="Numer telefonu"
              value={phoneNumber || 'Nie podano'}
            />
            <InfoTile
              icon={deliveryMethod === 'DELIVERY' ? <Truck size={20} /> : <Store size={20} />}
              label="Sposób odbioru"
              value={methodLabel}
            />
            <InfoTile
              icon={<Clock3 size={20} />}
              label={`Przybliżony czas ${timeLabel}`}
              value={deliveryTime ? formatDate(deliveryTime) : 'Czas nieznany'}
            />
          </div>

          {clientName && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium leading-6 text-slate-600">
              Zamówienie jest zapisane na imię{' '}
              <span className="font-bold text-secondary">{clientName}</span>.
              Obsługa restauracji rozpocznie jego realizację zgodnie z wybranym
              czasem.
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search size={22} />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold text-secondary">
            Co dalej?
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Status zamówienia możesz sprawdzić w każdej chwili. W razie zmian
            restauracja skontaktuje się telefonicznie.
          </p>

          <div className="mt-6 grid gap-3">
            <Button
              onClick={() => setIsOrderTrackingOpen(true)}
              className="h-12 rounded-xl bg-primary font-bold text-secondary hover:bg-primary/90"
            >
              <Search size={18} />
              Śledź zamówienie
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/order')}
              className="h-12 rounded-xl border border-slate-200 bg-white font-bold text-secondary hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Wróć do menu
            </Button>
          </div>
        </aside>
      </section>

      <OrderTrackingDialog
        isOpen={isOrderTrackingOpen}
        onOpenChange={setIsOrderTrackingOpen}
      />
    </main>
  )
}

const InfoTile = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode
  label: string
  value: string
  mono?: boolean
}) => (
  <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-bold text-secondary ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  </div>
)

export default ThankYouPage
