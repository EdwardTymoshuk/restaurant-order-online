'use client'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { RESTAURANT_COORDINATES } from '@/config/constants'
import {
  Coordinates,
  getCoordinates,
  haversineDistance,
} from '@/utils/deliveryUtils'
import { trpc } from '@/utils/trpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { DeliveryZone } from '../types/types'
import LoadingButton from './LoadingButton'

const formSchema = z.object({
  address: z.string().min(1, 'Wprowadź adres').max(200),
})

type FormData = z.infer<typeof formSchema>

interface DeliveryFormProps {
  formData: FormData
  onFormDataChange: (data: FormData) => void
  addressVerified: boolean
  setAddressVerified: (verified: boolean) => void
  setAddressCoordinates: (coordinates: Coordinates | null) => void // Додаємо пропс
}

export default function DeliveryForm({
  formData,
  onFormDataChange,
  addressVerified,
  setAddressVerified,
  setAddressCoordinates,
}: DeliveryFormProps) {
  const [addressValid, setAddressValid] = useState(true)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  })

  const { data: settingsData, isLoading: isSettingsLoading } =
    trpc.settings.getSettings.useQuery()
  // Parse delivery zones with type safety
  const deliveryZones: DeliveryZone[] = useMemo(() => {
    try {
      return Array.isArray(settingsData?.deliveryZones)
        ? (settingsData?.deliveryZones as unknown as DeliveryZone[])
        : []
    } catch {
      console.error('Failed to parse delivery zones from settings.')
      return []
    }
  }, [settingsData])

  const onSubmit = async (values: FormData) => {
    setLoading(true)
    setAddressVerified(false)

    const address = values.address
    const deliveryCoordinates = await getCoordinates(address)

    if (!deliveryCoordinates) {
      toast.error('Podany adres nie istnieje.')
      setLoading(false)
      return
    }

    const inDeliveryArea = deliveryZones.some((zone) => {
      const distance =
        haversineDistance(RESTAURANT_COORDINATES, deliveryCoordinates) / 1000
      return distance >= zone.minRadius && distance <= zone.maxRadius
    })

    setAddressCoordinates(deliveryCoordinates)

    if (inDeliveryArea) {
      setAddressVerified(true)
      toast.success(
        'Świetna wiadomość, Twój adres znajduje się w zasięgu naszej dostawy.'
      )
      localStorage.setItem('deliveryAddress', values.address)
    } else {
      toast.warning(
        'Niestety, Twój adres znajduje się poza зasięgiem naszej dostawy.'
      )
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(event) => {
                      field.onChange(event)
                      onFormDataChange({ address: event.target.value })
                      setAddressValid(true)
                    }}
                    className={`${
                      fieldState.invalid || !addressValid
                        ? 'border-danger'
                        : ''
                    } h-12 rounded-xl bg-white px-4 text-sm`}
                    placeholder="Wprowadź adres dostawy"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Використовуємо одну кнопку для обох випадків */}
          {/* <LoadingButton
						isLoading={loading || isPending} // Показуємо стан завантаження під час переходу
						type={addressVerified ? "button" : "submit"}
						variant='secondary'
						className="w-full my-4"
						onClick={handleOrderClick}
					>
						{addressVerified ? (
							<div className="flex items-center">
								Do zamówienia <MdOutlineKeyboardArrowRight />
							</div>
						) : (
							"Sprawdź"
						)}
					</LoadingButton> */}
          <LoadingButton
            isLoading={loading}
            type="submit"
            variant="default"
            className="h-12 w-full rounded-xl bg-primary text-secondary hover:bg-primary/90"
          >
            Sprawdź
          </LoadingButton>
        </form>
      </Form>
    </div>
  )
}
