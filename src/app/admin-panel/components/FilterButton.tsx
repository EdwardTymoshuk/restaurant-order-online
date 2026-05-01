'use client'

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
import { cn } from '@/utils/utils'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

interface FilterOption {
  label: string
  value: string
}

interface FilterGroup {
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  allLabel?: string
}

interface FilterButtonProps {
  filters: FilterGroup[]
  activeCount?: number
  onClear?: () => void
  className?: string
}

export const FilterButton = ({ filters, activeCount = 0, onClear, className }: FilterButtonProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative flex items-center gap-2 h-8 px-3.5 rounded-lg text-sm font-sans font-normal transition-all duration-150 focus:outline-none',
            open ? 'bg-secondary/80 text-white' : 'bg-secondary text-white hover:bg-secondary/85',
            className
          )}
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          Filtruj
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-secondary text-[10px] font-semibold flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4 space-y-4">
        {filters.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <p className="text-xs font-sans font-normal text-dark-gray">{group.label}</p>
            <Select
              value={group.value}
              onValueChange={(v) => { group.onChange(v); setOpen(false) }}
            >
              <SelectTrigger className="w-full h-9 text-sm font-sans font-normal bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{group.allLabel ?? 'Wszystkie'}</SelectItem>
                {group.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="pt-1 border-t border-border">
          <button
            onClick={() => { onClear?.(); setOpen(false) }}
            disabled={activeCount === 0}
            className={cn(
              'w-full text-center text-sm font-sans font-normal py-1 transition-colors',
              activeCount > 0
                ? 'text-secondary hover:text-secondary/70'
                : 'text-muted-foreground cursor-default'
            )}
          >
            Wyczyść filtry
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
