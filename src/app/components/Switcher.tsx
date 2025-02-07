'use client'

interface SwitcherProps<T> {
	options: {
		value: T
		label: string
		icon: React.ReactNode
		disabled?: boolean
	}[]
	activeValue: T
	onChange: (value: T) => void
}

const Switcher = <T,>({ options, activeValue, onChange }: SwitcherProps<T>) => {
	return (
		<div className="relative inline-flex cursor-pointer items-center rounded-md bg-background p-1 shadow-card w-full justify-center">
			{options.map((option) => (
				<span
					aria-disabled={option.disabled}
					key={option.value as string}
					className={`flex items-center gap-2 space-x-2 rounded py-2 px-4 font-bold ${activeValue === option.value ? 'text-text-primary bg-primary' : option.disabled ? 'cursor-not-allowed text-gray-300' : 'text-secondary'}`}
					onClick={() => onChange(option.value)}
				>
					{option.icon}
					{option.label}
				</span>
			))}
		</div>
	)
}

export default Switcher
