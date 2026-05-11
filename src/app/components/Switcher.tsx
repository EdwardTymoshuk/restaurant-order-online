'use client'

import type { ReactNode } from 'react'

import { cn } from '@/utils/utils'

interface SwitcherProps<T> {
	options: {
		value: T
		label: string
		icon: ReactNode
		description?: string
		disabled?: boolean
	}[]
	activeValue: T
	onChange: (value: T) => void
}

const Switcher = <T,>({ options, activeValue, onChange }: SwitcherProps<T>) => {
	return (
		<div className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
			{options.map((option) => {
				const isActive = activeValue === option.value

				return (
					<button
						key={option.value as string}
						type="button"
						disabled={option.disabled}
						onClick={() => onChange(option.value)}
						className={cn(
							'flex min-h-[74px] items-center gap-3 rounded-xl px-4 text-left transition',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
							isActive
								? 'bg-secondary text-white shadow-md'
								: 'bg-white/70 text-slate-600 hover:bg-white hover:text-secondary',
							option.disabled && 'cursor-not-allowed opacity-45 hover:bg-white/70 hover:text-slate-600'
						)}
						aria-pressed={isActive}
					>
						<span
							className={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-full',
								isActive ? 'bg-white/15 text-primary' : 'bg-primary/10 text-primary'
							)}
						>
							{option.icon}
						</span>
						<span className="flex flex-col">
							<span className="text-sm font-semibold">{option.label}</span>
							{option.description && (
								<span className={cn('text-xs', isActive ? 'text-white/70' : 'text-slate-400')}>
									{option.description}
								</span>
							)}
						</span>
					</button>
				)
			})}
		</div>
	)
}


export default Switcher
