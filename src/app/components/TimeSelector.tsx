'use client'

import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/app/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { CLOSING_HOUR, OPENING_HOUR } from '@/config/constants'
import { cn } from '@/utils/utils'

interface TimeSelectorProps {
  selectedTime: Date | null
  onTimeChange: (date: Date | null) => void
  setNearestHour: () => Date
  filterTime: (time: Date) => boolean
}

const weekDays = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nie']

const getMondayIndex = (date: Date) => {
  const day = getDay(date)
  return day === 0 ? 6 : day - 1
}

const formatTime = (date: Date) => format(date, 'HH:mm')

export function TimeSelector({
  selectedTime,
  onTimeChange,
  setNearestHour,
  filterTime,
}: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(
    startOfMonth(selectedTime ?? new Date())
  )

  const selectedDate = useMemo(
    () => selectedTime ?? setNearestHour(),
    [selectedTime, setNearestHour]
  )
  const today = startOfDay(new Date())

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth)
    const lastDay = endOfMonth(visibleMonth)
    const leadingEmptyDays = getMondayIndex(firstDay)
    const days: Array<Date | null> = Array.from({ length: leadingEmptyDays }, () => null)

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    }

    return days
  }, [visibleMonth])

  const getTimeSlots = useCallback((date: Date) => {
    const slots: Date[] = []

    for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour += 1) {
      for (const minute of [0, 15, 30, 45]) {
        const slot = new Date(date)
        slot.setHours(hour, minute, 0, 0)

        if (filterTime(slot)) {
          slots.push(slot)
        }
      }
    }

    return slots
  }, [filterTime])

  const timeSlots = useMemo(() => getTimeSlots(selectedDate), [selectedDate, getTimeSlots])

  const selectDate = (date: Date) => {
    if (date < today) return

    const preservedTime = selectedTime ?? setNearestHour()
    const candidate = new Date(date)
    candidate.setHours(
      preservedTime.getHours(),
      preservedTime.getMinutes(),
      0,
      0
    )

    if (filterTime(candidate)) {
      onTimeChange(candidate)
      return
    }

    const [firstAvailableSlot] = getTimeSlots(date)
    if (firstAvailableSlot) {
      onTimeChange(firstAvailableSlot)
    }
  }

  const selectTime = (time: Date) => {
    onTimeChange(time)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-12 w-full justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-left font-semibold text-secondary',
            'hover:border-secondary/30 hover:bg-white focus-visible:ring-primary'
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays size={18} className="shrink-0 text-primary" />
            <span className="truncate">
              {format(selectedDate, 'd MMMM yyyy, HH:mm', { locale: pl })}
            </span>
          </span>
          <Clock size={18} className="shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="max-h-[calc(100vh-5rem)] w-[calc(100vw-1.5rem)] max-w-[620px] overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-2xl shadow-secondary/15"
      >
        <div className="grid gap-0 overflow-hidden rounded-2xl bg-white sm:grid-cols-[1fr_180px]">
          <div className="p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between sm:mb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-slate-100 sm:size-9"
                onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="text-center">
                <p className="font-serif text-lg font-bold capitalize text-secondary sm:text-xl">
                  {format(visibleMonth, 'LLLL yyyy', { locale: pl })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-slate-100 sm:size-9"
                onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
              {weekDays.map((day) => (
                <span key={day} className="py-1.5 sm:py-2">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <span key={`empty-${index}`} className="size-8 sm:size-10" />
                }

                const isPast = date < today
                const isSelected = isSameDay(date, selectedDate)

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => selectDate(date)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-sm font-semibold transition sm:size-10',
                      isSelected
                        ? 'bg-secondary text-white shadow-md shadow-secondary/15'
                        : 'text-slate-700 hover:bg-primary/15 hover:text-secondary',
                      isToday(date) && !isSelected && 'text-secondary ring-1 ring-primary/40',
                      !isSameMonth(date, visibleMonth) && 'text-slate-300',
                      isPast && 'cursor-not-allowed text-slate-300 hover:bg-transparent'
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-2.5 sm:border-l sm:border-t-0 sm:p-3">
            <p className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-secondary sm:mb-3">
              <Clock size={16} className="text-primary" />
              Godzina
            </p>

            {timeSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm font-medium text-slate-400">
                Brak dostępnych godzin.
              </div>
            ) : (
              <div className="grid max-h-[184px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:max-h-[286px] sm:grid-cols-1">
                {timeSlots.map((slot) => {
                  const isSelected =
                    selectedTime &&
                    isSameDay(slot, selectedTime) &&
                    formatTime(slot) === formatTime(selectedTime)

                  return (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      onClick={() => selectTime(slot)}
                      className={cn(
                        'rounded-xl px-2 py-2 text-sm font-bold transition sm:px-3',
                        isSelected
                          ? 'bg-secondary text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-primary/15 hover:text-secondary'
                      )}
                    >
                      {formatTime(slot)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
