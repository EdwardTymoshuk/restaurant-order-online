'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import { Calendar } from '@/app/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { cn } from '@/utils/utils'
import { trpc } from '@/utils/trpc'
import dayjs from 'dayjs'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PromoCode {
  id: string
  code: string
  discountType: 'FIXED' | 'PERCENTAGE'
  discountValue: number
  isActive: boolean
  isUsed: boolean
  expiresAt: Date | null
  startDate: Date | null
  isOneTimeUse: boolean
  _count: { orders: number }
}

function computeStatus(promo: PromoCode): { label: string; color: string } {
  const now = new Date()
  if (!promo.isActive) return { label: 'Nieaktywny', color: 'text-slate-400' }
  if (promo.expiresAt && new Date(promo.expiresAt) < now) return { label: 'Wygasły', color: 'text-red-500' }
  if (promo.startDate && new Date(promo.startDate) > now) return { label: 'Oczekujący', color: 'text-blue-500' }
  if (promo.isOneTimeUse && promo.isUsed) return { label: 'Wykorzystany', color: 'text-amber-600' }
  return { label: 'Aktywny', color: 'text-green-600' }
}

interface DatePickerFieldProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
}

const DatePickerField = ({ value, onChange, placeholder = 'Wybierz datę' }: DatePickerFieldProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        {value ? format(value, 'dd.MM.yyyy', { locale: pl }) : placeholder}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={value}
        onSelect={onChange}
        locale={pl}
        initialFocus
      />
    </PopoverContent>
  </Popover>
)

const PromoCodeSettings: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: promoCodesData, refetch } = trpc.promoCode.getAllPromoCodes.useQuery()

  const createPromoCode = trpc.promoCode.createPromoCode.useMutation({ onSuccess: () => refetch() })
  const deletePromoCode = trpc.promoCode.deletePromoCode.useMutation({ onSuccess: () => refetch() })
  const updatePromoCode = trpc.promoCode.updatePromoCode.useMutation({ onSuccess: () => refetch() })

  const [newCode, setNewCode] = useState<{
    code: string
    discountType: 'FIXED' | 'PERCENTAGE'
    discountValue: string
    isOneTimeUse: boolean
    useDateRange: boolean
    startDate: Date | undefined
    endDate: Date | undefined
    expiresInDays: number | null
  }>({
    code: '',
    discountType: 'FIXED',
    discountValue: '',
    isOneTimeUse: false,
    useDateRange: false,
    startDate: undefined,
    endDate: undefined,
    expiresInDays: null,
  })

  useEffect(() => {
    if (promoCodesData) setPromoCodes(promoCodesData as PromoCode[])
  }, [promoCodesData])

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const resetForm = () =>
    setNewCode({
      code: '',
      discountType: 'FIXED',
      discountValue: '',
      isOneTimeUse: false,
      useDateRange: false,
      startDate: undefined,
      endDate: undefined,
      expiresInDays: null,
    })

  const handleAdd = () => {
    if (!newCode.code.trim()) {
      toast.warning('Proszę wpisać kod promocyjny.')
      return
    }
    const discountValue = parseFloat(newCode.discountValue)
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.warning('Proszę wpisać prawidłową wartość zniżki.')
      return
    }
    if (newCode.useDateRange && (!newCode.startDate || !newCode.endDate)) {
      toast.warning('Proszę wybrać daty rozpoczęcia i zakończenia.')
      return
    }

    if (newCode.useDateRange) {
      createPromoCode.mutate({
        code: newCode.code,
        discountType: newCode.discountType,
        discountValue,
        isActive: true,
        isOneTimeUse: newCode.isOneTimeUse,
        startDate: newCode.startDate!.toISOString(),
        expiresAt: newCode.endDate!.toISOString(),
      })
    } else {
      const expiresAt = newCode.expiresInDays
        ? dayjs().add(newCode.expiresInDays, 'day').toISOString()
        : undefined
      createPromoCode.mutate({
        code: newCode.code,
        discountType: newCode.discountType,
        discountValue,
        isActive: true,
        isOneTimeUse: newCode.isOneTimeUse,
        expiresAt,
      })
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleToggleActive = (promo: PromoCode) => {
    updatePromoCode.mutate({ id: promo.id, isActive: !promo.isActive })
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="promoCodes" className="border-0">
        <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
          <span className="flex w-full items-center justify-between gap-3 pr-3">
            <span>Kody promocyjne</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {promoCodes.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Wartość</TableHead>
                  <TableHead>Obowiązuje od</TableHead>
                  <TableHead>Wygasa</TableHead>
                  <TableHead>Użyto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktywny</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => {
                  const { label, color } = computeStatus(promo)
                  return (
                    <TableRow key={promo.id}>
                      <TableCell className="font-bold">{promo.code}</TableCell>
                      <TableCell>{promo.discountType === 'FIXED' ? 'Kwota' : 'Procent'}</TableCell>
                      <TableCell>
                        {promo.discountValue}{promo.discountType === 'FIXED' ? ' zł' : '%'}
                      </TableCell>
                      <TableCell>
                        {promo.startDate ? dayjs(promo.startDate).format('DD.MM.YYYY') : '—'}
                      </TableCell>
                      <TableCell>
                        {promo.expiresAt ? dayjs(promo.expiresAt).format('DD.MM.YYYY') : 'Bezterminowy'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">×{promo._count.orders}</span>
                        {promo.isOneTimeUse && (
                          <span className="ml-1 text-xs text-slate-400">(1×)</span>
                        )}
                      </TableCell>
                      <TableCell className={cn('font-medium', color)}>{label}</TableCell>
                      <TableCell>
                        <Switch
                          checked={promo.isActive}
                          onCheckedChange={() => handleToggleActive(promo)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deletePromoCode.mutate({ id: promo.id })}
                        >
                          Usuń
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
            Dodaj kod
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowy kod promocyjny</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Kod"
                    value={newCode.code}
                    onChange={(e) => setNewCode((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setNewCode((p) => ({ ...p, code: generateRandomCode() }))}
                  >
                    Generuj
                  </Button>
                </div>

                <Select
                  value={newCode.discountType}
                  onValueChange={(v) =>
                    setNewCode((p) => ({ ...p, discountType: v as 'FIXED' | 'PERCENTAGE', discountValue: '' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Typ zniżki" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Kwota stała (zł)</SelectItem>
                    <SelectItem value="PERCENTAGE">Procent (%)</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder={newCode.discountType === 'FIXED' ? 'Wartość w zł' : 'Procent (1–100)'}
                  value={newCode.discountValue}
                  min={0}
                  max={newCode.discountType === 'PERCENTAGE' ? 100 : undefined}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (isNaN(val) || val < 0) val = 0
                    if (newCode.discountType === 'PERCENTAGE' && val > 100) val = 100
                    setNewCode((p) => ({ ...p, discountValue: val.toString() }))
                  }}
                />

                <label className="flex items-center gap-2">
                  <Switch
                    checked={newCode.isOneTimeUse}
                    onCheckedChange={(v) => setNewCode((p) => ({ ...p, isOneTimeUse: v }))}
                  />
                  <span className="text-sm">Kod jednorazowy</span>
                </label>

                <label className="flex items-center gap-2">
                  <Switch
                    checked={newCode.useDateRange}
                    onCheckedChange={(v) =>
                      setNewCode((p) => ({ ...p, useDateRange: v, startDate: undefined, endDate: undefined }))
                    }
                  />
                  <span className="text-sm">Zakres dat aktywności</span>
                </label>

                {newCode.useDateRange ? (
                  <div className="space-y-2">
                    <DatePickerField
                      value={newCode.startDate}
                      onChange={(d) => setNewCode((p) => ({ ...p, startDate: d }))}
                      placeholder="Data rozpoczęcia"
                    />
                    <DatePickerField
                      value={newCode.endDate}
                      onChange={(d) => setNewCode((p) => ({ ...p, endDate: d }))}
                      placeholder="Data zakończenia"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={newCode.expiresInDays === null}
                        onCheckedChange={(v) =>
                          setNewCode((p) => ({ ...p, expiresInDays: v ? null : 30 }))
                        }
                      />
                      <span className="text-sm">
                        {newCode.expiresInDays === null ? 'Bezterminowy' : 'Terminowy'}
                      </span>
                    </label>
                    {newCode.expiresInDays !== null && (
                      <div className="pt-3">
                        <Input
                          type="number"
                          placeholder="Liczba dni ważności"
                          value={newCode.expiresInDays}
                          min={1}
                          onChange={(e) =>
                            setNewCode((p) => ({ ...p, expiresInDays: Number(e.target.value) }))
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  onClick={handleAdd}
                  disabled={!newCode.code.trim() || !newCode.discountValue.trim()}
                >
                  Dodaj
                </Button>
                <Button variant="secondary" onClick={() => { resetForm(); setIsDialogOpen(false) }}>
                  Anuluj
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default PromoCodeSettings
