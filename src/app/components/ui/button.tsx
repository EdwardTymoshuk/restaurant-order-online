import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/utils/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 hover:bg-destructive/90 hover:shadow-md active:scale-[0.98]',
        outline:
          'border border-input bg-background text-slate-700 hover:border-secondary/25 hover:bg-secondary/5 hover:text-secondary active:scale-[0.98]',
        secondary: 'bg-secondary text-text-primary shadow-sm shadow-secondary/20 hover:bg-secondary/90 hover:shadow-md active:scale-[0.98]',
        ghost: 'rounded-xl hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        link: 'text-primary hover:brightness-105',
        icon: 'bg-transparent hover:bg-transparent p-0 m-0 hover:text-secondary',
        success: 'bg-success text-text-primary shadow-sm shadow-success/20 hover:bg-success/85 hover:shadow-md active:scale-[0.98]',
        warning: 'bg-warning text-secondary shadow-sm shadow-warning/20 hover:bg-warning/85 hover:shadow-md active:scale-[0.98]',
        danger: 'bg-danger text-text-primary shadow-sm shadow-danger/20 hover:bg-danger/85 hover:shadow-md active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        link: 'px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
