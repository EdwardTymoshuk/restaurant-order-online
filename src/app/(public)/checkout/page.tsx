'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Bike, ReceiptText, ShoppingBag, Store } from 'lucide-react'

import CheckoutDeliveryForm from '@/app/components/CheckoutDeliveryForm'
import CheckoutTakeOutForm from '@/app/components/CheckoutTakeOutForm'
import DeliveryCostDisplay from '@/app/components/DeliveryCostDisplay'
import ImageWithFallback from '@/app/components/ImageWithFallback'
import LoadingButton from '@/app/components/LoadingButton'
import Switcher from '@/app/components/Switcher'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { useCart } from '@/app/context/CartContext'
import { DeliveryZone } from '@/app/types/types'
import { DEFAULT_DELIVERY_ZONES, MIN_ORDER_AMOUNT } from '@/config/constants'
import { Coordinates } from '@/utils/deliveryUtils'
import { trpc } from '@/utils/trpc'

export default function CheckoutPage() {
  const { state, dispatch } = useCart()
  const router = useRouter()

  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'TAKE_OUT'>(
    'DELIVERY'
  )
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [privacyError, setPrivacyError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryCoordinates, setDeliveryCoordinates] =
    useState<Coordinates | null>(null)

  const { data: settingsData } = trpc.settings.getSettings.useQuery()

  const deliveryZones: DeliveryZone[] = Array.isArray(
    settingsData?.deliveryZones
  )
    ? (settingsData?.deliveryZones as unknown as DeliveryZone[])
    : DEFAULT_DELIVERY_ZONES

  const isValentinesItemInCart = state.items.some(
    (item) => item.category === 'Oferta Walentynkowa'
  )

  useEffect(() => {
    const savedMethod = localStorage.getItem('deliveryMethod') as
      | 'DELIVERY'
      | 'TAKE_OUT'

    if (savedMethod) {
      setDeliveryMethod(savedMethod)
    }
  }, [])

  const amountNeeded = Math.max(0, MIN_ORDER_AMOUNT - state.totalAmount)
  const now = new Date()
  const isBreakfast = now.getHours() < 12
  const deliveryExtra =
    state.deliveryMethod === 'DELIVERY' && state.deliveryCost !== null
      ? state.deliveryCost
      : 0
  const discountAmount = state.deliveryDiscount || state.takeOutDiscount
    ? state.totalAmount - (state.finalAmount - deliveryExtra)
    : 0

  return (
    <div className="min-h-[calc(100vh-48px)] w-full bg-[#f5f6f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-4 px-4 py-5 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/order')}
            className="w-fit rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-secondary"
          >
            <ArrowLeft size={17} />
            Wróć do menu
          </Button>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Finalizacja zamówienia
            </span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-secondary md:text-5xl">
              Podsumowanie zamówienia
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500 md:text-base">
              Sprawdź koszyk, wybierz sposób odbioru i uzupełnij dane potrzebne
              do realizacji zamówienia.
            </p>
          </div>
        </div>
      </header>

      <main className="grid w-full gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,480px)] lg:px-8">
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {deliveryMethod === 'DELIVERY' ? (
                  <Bike size={21} />
                ) : (
                  <Store size={21} />
                )}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-secondary">
                  Jak chcesz odebrać zamówienie?
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Dostawa pod wskazany adres albo szybki odbiór w restauracji.
                </p>
              </div>
            </div>

            <Switcher
              options={[
                {
                  value: 'DELIVERY',
                  label: 'Dostawa',
                  description: 'Pod wskazany adres',
                  icon: <Bike size={18} />,
                },
                {
                  value: 'TAKE_OUT',
                  label: 'Odbiór',
                  description: 'Odbiór w restauracji',
                  icon: <Store size={18} />,
                  disabled: isValentinesItemInCart,
                },
              ]}
              activeValue={deliveryMethod}
              onChange={(val) => {
                if (!isValentinesItemInCart || val === 'DELIVERY') {
                  setDeliveryMethod(val as 'DELIVERY' | 'TAKE_OUT')
                  dispatch({
                    type: 'SET_DELIVERY_METHOD',
                    payload: val as 'DELIVERY' | 'TAKE_OUT',
                  })
                  localStorage.setItem('deliveryMethod', val)
                }
              }}
            />
          </div>

          <div className="space-y-5">
            {deliveryMethod === 'DELIVERY' && (
              <CheckoutDeliveryForm
                acceptPrivacy={acceptPrivacy}
                setPrivacyError={setPrivacyError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                isBreakfast={isBreakfast}
                settingsData={settingsData}
                deliveryZones={deliveryZones}
                deliveryCoordinates={deliveryCoordinates}
                setDeliveryCoordinates={setDeliveryCoordinates}
              />
            )}

            {deliveryMethod === 'TAKE_OUT' && (
              <CheckoutTakeOutForm
                acceptPrivacy={acceptPrivacy}
                setPrivacyError={setPrivacyError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                isBreakfast={isBreakfast}
              />
            )}
          </div>
        </section>

        <aside className="self-start rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-16">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Koszyk
              </span>
              <h2 className="font-serif text-2xl font-bold text-secondary">
                Twoje zamówienie
              </h2>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBag size={22} />
            </div>
          </div>

          {state.items.length === 0 ? (
            <div className="m-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <ReceiptText className="mx-auto mb-3 text-slate-300" size={36} />
              <h3 className="font-serif text-2xl font-bold text-secondary">
                Koszyk jest pusty
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Wróć do menu i wybierz coś dobrego ze Spoko Sopot.
              </p>
              <Button
                onClick={() => router.push('/order')}
                className="mt-5 rounded-xl bg-primary px-5 text-secondary hover:bg-primary/90"
              >
                Przejdź do menu
              </Button>
            </div>
          ) : (
            <>
              <ul className="max-h-[42vh] space-y-3 overflow-y-auto px-5 py-5">
                {state.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <ImageWithFallback
                        width={80}
                        height={80}
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-secondary">
                          {item.name}
                        </h3>
                        <span className="shrink-0 text-sm font-bold text-secondary">
                          {(item.price * item.quantity).toFixed(2)} zł
                        </span>
                      </div>
                      <p className="mt-auto pt-2 text-xs font-semibold text-slate-400">
                        Ilość: {item.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 border-t border-slate-100 px-5 py-5">
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Wartość zamówienia</span>
                  <span className="font-bold text-secondary">
                    {state.totalAmount.toFixed(2)} zł
                  </span>
                </div>

                {deliveryMethod === 'DELIVERY' && (
                  <DeliveryCostDisplay deliveryCost={state.deliveryCost} />
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-primary">
                    <span>Rabat</span>
                    <span>-{discountAmount.toFixed(2)} zł</span>
                  </div>
                )}

                {state.totalAmount < MIN_ORDER_AMOUNT && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-5 text-amber-800">
                    Brakuje jeszcze {amountNeeded.toFixed(2)} zł do minimalnej
                    kwoty zamówienia, która wynosi 50 zł.
                  </div>
                )}

                <div className="flex items-end justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-500">
                    Do zapłaty
                  </span>
                  <span className="text-3xl font-bold text-secondary">
                    {state.finalAmount.toFixed(2)} zł
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 px-5 py-5">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Checkbox
                    id="privacy"
                    checked={acceptPrivacy}
                    onCheckedChange={(checked) => {
                      setAcceptPrivacy(Boolean(checked))
                      if (privacyError && checked) {
                        setPrivacyError(false)
                      }
                    }}
                    className={privacyError ? 'border-danger' : ''}
                  />
                  <label
                    htmlFor="privacy"
                    className="text-sm font-medium leading-5 text-slate-600"
                  >
                    Zapoznałem się z{' '}
                    <Link
                      href="/privacy-policy"
                      className="font-bold text-secondary underline decoration-primary underline-offset-4"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Polityką Prywatności
                    </Link>{' '}
                    i wyrażam zgodę na przetwarzanie moich danych w celu
                    realizacji zamówienia.
                  </label>
                </div>

                {privacyError && (
                  <span className="block text-sm font-semibold text-danger">
                    Musisz zaakceptować politykę prywatności, aby złożyć
                    zamówienie.
                  </span>
                )}

                <LoadingButton
                  isLoading={isLoading}
                  className="h-12 w-full rounded-xl bg-primary text-base font-bold text-secondary hover:bg-primary/90"
                  type="submit"
                  form={
                    deliveryMethod === 'DELIVERY'
                      ? 'deliveryForm'
                      : 'takeOutForm'
                  }
                  disabled={state.totalAmount < MIN_ORDER_AMOUNT}
                >
                  Złóż zamówienie
                </LoadingButton>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
