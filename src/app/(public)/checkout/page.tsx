'use client'

/**
 * Checkout Page
 * This page shows:
 *  - top navigation (back to menu)
 *  - method switcher (Dostawa / Odbiór)
 *  - cart summary
 *  - final "Złóż zamówienie" button referencing the correct form by ID
 * It also manages acceptPrivacy, privacyError, isLoading, etc. states
 * that are shared with the forms via props.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import { Button } from '@/app/components/ui/button'
import { Separator } from '@/app/components/ui/separator'
import {
  MdKeyboardArrowLeft,
  MdOutlineDeliveryDining,
  MdOutlineRestaurantMenu,
} from 'react-icons/md'

import { useCart } from '@/app/context/CartContext'
import { useCheckout } from '@/app/context/CheckoutContext'
import { useOrder } from '@/app/context/OrderContext'

import { DeliveryZone } from '@/app/types/types'
import { DEFAULT_DELIVERY_ZONES, MIN_ORDER_AMOUNT } from '@/config/constants'

// import DeliveryCostDisplay from "@/app/checkout/components/DeliveryCostDisplay"
import ImageWithFallback from '@/app/components/ImageWithFallback'
import LoadingButton from '@/app/components/LoadingButton'
import PageSubHeader from '@/app/components/PageSubHeader'
import Switcher from '@/app/components/Switcher'

import CheckoutDeliveryForm from '@/app/components/CheckoutDeliveryForm'
import CheckoutTakeOutForm from '@/app/components/CheckoutTakeOutForm'
import DeliveryCostDisplay from '@/app/components/DeliveryCostDisplay'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Coordinates } from '@/utils/deliveryUtils'
import { trpc } from '@/utils/trpc'

export default function CheckoutPage() {
  // Cart state
  const { state, dispatch } = useCart()
  // Order context (if needed)
  const { setOrderData } = useOrder()
  // Next.js router
  const router = useRouter()
  // Check if restaurant is closed (from your custom checkout context)
  const { isRestaurantClosed } = useCheckout()

  // Local states: method, privacy acceptance, error states, etc.
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'TAKE_OUT'>(
    'DELIVERY'
  )
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [privacyError, setPrivacyError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null)

  // For toggling transitions (if needed)
  const [isPending, startTransition] = useTransition()

  // Get settings to possibly pass to forms or to show map
  const { data: settingsData, isLoading: isSettingsLoading } =
    trpc.settings.getSettings.useQuery()

  // Delivery zones from DB or default
  const deliveryZones: DeliveryZone[] = Array.isArray(
    settingsData?.deliveryZones
  )
    ? (settingsData?.deliveryZones as unknown as DeliveryZone[])
    : DEFAULT_DELIVERY_ZONES

  // Keep track of address marker for the map? If you want
  const [deliveryCoordinates, setDeliveryCoordinates] =
    useState<Coordinates | null>(null)

  const isValentinesItemInCart = state.items.some(
    (item) => item.category === 'Oferta Walentynkowa'
  )

  // For Google Maps
  const libraries: 'places'[] = ['places']

  // Restore deliveryMethod from localStorage if needed
  useEffect(() => {
    const savedMethod = localStorage.getItem('deliveryMethod') as
      | 'DELIVERY'
      | 'TAKE_OUT'
    if (savedMethod) {
      setDeliveryMethod(savedMethod)
    }
  }, [])

  // Minimal order logic
  const amountNeeded = Math.max(0, MIN_ORDER_AMOUNT - state.totalAmount)

  // If you need time-based logic for "Breakfast or not"
  const now = new Date()
  const isBreakfast = now.getHours() < 12

  return (
    <div className="container mx-auto p-4">
      {/* Back to menu button */}
      <Button
        variant="link"
        onClick={() => router.push('/order')}
        className="p-0 text-secondary"
      >
        <MdKeyboardArrowLeft size={24} />
        <span>Wróć do menu</span>
      </Button>

      {/* Page header */}
      <PageSubHeader title="Podsumowanie zamówienia" />

      <div className="flex flex-col md:flex-row justify-between gap-8">
        {/* LEFT COLUMN: Switcher + Delivery/TakeOut forms */}
        <div className="space-y-8 w-full">
          <div className="space-y-2">
            <h3 className="text-xl text-secondary font-semibold">
              Metoda dostawy
            </h3>
            {/* Switcher for 'DELIVERY' / 'TAKE_OUT' */}
            <Switcher
              options={[
                {
                  value: 'DELIVERY',
                  label: 'Dostawa',
                  icon: <MdOutlineDeliveryDining />,
                },
                {
                  value: 'TAKE_OUT',
                  label: 'Odbiór',
                  icon: <MdOutlineRestaurantMenu />,
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

          {/* Render DeliveryForm or TakeOutForm depending on method */}
          {deliveryMethod === 'DELIVERY' && (
            <CheckoutDeliveryForm
              // Passing states for privacy checks, loading, etc.
              acceptPrivacy={acceptPrivacy}
              setPrivacyError={setPrivacyError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              isBreakfast={isBreakfast}
              settingsData={settingsData}
              deliveryZones={deliveryZones}
              // If you want to pass the map coordinates as well
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

        {/* Separator on desktop */}
        <Separator className="hidden md:flex h-auto" orientation="vertical" />

        {/* RIGHT COLUMN: Order Summary */}
        <div className="space-y-6 w-full">
          <h3 className="text-xl text-secondary font-semibold">
            Twoje zamówienie
          </h3>
          {state.items.length === 0 ? (
            <div className="flex flex-col gap-2 items-center justify-center">
              <h4 className="text-2xl bold">
                Niestety Twój koszyk jest pusty :(
              </h4>
              <p className="text-center text-text-foreground">
                Spradź nasze{' '}
                <Link href="/order" className="text-primary">
                  menu
                </Link>{' '}
                aby przekonać się jakie pyszne rzeczy mamy dla Ciebie!
              </p>
            </div>
          ) : (
            <>
              {/* List of items */}
              <ul className="divide-y divide-gray-200">
                {state.items.map((item) => (
                  <li key={item.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <ImageWithFallback
                        width={96}
                        height={96}
                        src={item.image}
                        alt={item.name}
                        className="object-cover object-center"
                        containerClassName="w-full h-full"
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-secondary font-medium">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Ilość: {item.quantity}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} zł
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Price details */}
              <div className="space-y-4">
                <div className="flex font-sans justify-between text-lg text-text-secondary">
                  <span>Wartość zamówienia</span>
                  <span>{state.totalAmount.toFixed(2)} zł</span>
                </div>

                {deliveryMethod === 'DELIVERY' && (
                  <DeliveryCostDisplay deliveryCost={state.deliveryCost} />
                )}

                {/* Show discount if any */}
                {(state.deliveryDiscount || state.takeOutDiscount) && (
                  <div className="flex font-sans justify-between text-lg text-primary">
                    <span>Rabat</span>
                    <span>
                      -
                      {(
                        state.totalAmount -
                        (state.finalAmount -
                          (state.deliveryMethod === 'DELIVERY' &&
                          state.deliveryCost !== null
                            ? state.deliveryCost
                            : 0))
                      ).toFixed(2)}{' '}
                      zł
                    </span>
                  </div>
                )}

                {/* Minimal order note */}
                {state.totalAmount < MIN_ORDER_AMOUNT && (
                  <div className="mt-4 p-2 bg-warning-light text-warning text-center rounded-md">
                    Brakuje jeszcze {amountNeeded.toFixed(2)} zł do minimalnej
                    kwoty zamówienia, która wynosi 50 zł.
                  </div>
                )}

                {/* Final sum */}
                <div className="flex font-sans justify-between text-xl font-bold text-text-secondary">
                  <span>Do zapłaty</span>
                  <span>{state.finalAmount.toFixed(2)} zł</span>
                </div>
              </div>
            </>
          )}

          {/* Privacy policy acceptance */}
          {state.items.length > 0 && (
            <div className="flex flex-col space-y-1">
              <div className="flex items-start space-x-2">
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
                  className="leading-tight text-sm font-normal text-muted-foreground"
                >
                  Zapoznałem się z{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-primary underline"
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
                <span className="text-danger text-sm">
                  Musisz zaakceptować politykę prywatności, aby złożyć
                  zamówienie.
                </span>
              )}
            </div>
          )}

          {/* Final button that references the correct form by ID */}
          {state.items.length > 0 && (
            <LoadingButton
              variant="secondary"
              isLoading={isLoading}
              className="w-full"
              type="submit"
              // This "form" attribute triggers the <form id="..."> in the components
              form={
                deliveryMethod === 'DELIVERY' ? 'deliveryForm' : 'takeOutForm'
              }
              disabled={state.totalAmount < MIN_ORDER_AMOUNT}
            >
              Złóż zamówienie
            </LoadingButton>
          )}
        </div>
      </div>
    </div>
  )
}
