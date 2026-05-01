'use client'

import { cn } from '@/utils/utils'

interface PageHeaderProps {
  /** Left side: page title */
  title: string
  /** Left side: CTA buttons next to title */
  actions?: React.ReactNode
  /** Center: tabs */
  tabs?: React.ReactNode
  /** Right side: filter button, search, etc. */
  toolbar?: React.ReactNode
  className?: string
}

/**
 * Sticky subheader bar pinned below AdminNavbar (top-14).
 * Layout: [title + actions] | [tabs centered] | [toolbar]
 * Optionally renders an expandable filter panel below the bar.
 */
export const PageHeader = ({
  title,
  actions,
  tabs,
  toolbar,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn('sticky top-0 z-20 bg-white border-b border-border shrink-0', className)}>
      <div className="h-14 flex items-center gap-4 px-4 md:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-base font-sans font-semibold text-dark-gray">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Center */}
        {tabs && (
          <div className="flex-1 flex items-center justify-center overflow-x-auto">
            {tabs}
          </div>
        )}

        {/* Right */}
        {toolbar && (
          <div className={cn('flex items-center gap-2 shrink-0', !tabs && 'ml-auto')}>
            {toolbar}
          </div>
        )}
      </div>
    </div>
  )
}
