'use client'

import { cn } from '@/utils/utils'
import { WheelEvent, useCallback, useEffect, useRef, useState } from 'react'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

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
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false)

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const maxScrollLeft = element.scrollWidth - element.clientWidth
    setHasHorizontalOverflow(maxScrollLeft > 4)
    setCanScrollLeft(element.scrollLeft > 4)
    setCanScrollRight(maxScrollLeft - element.scrollLeft > 4)
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    updateScrollState()

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(element)
    if (element.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(element.firstElementChild)
    }

    element.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      resizeObserver.disconnect()
      element.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [actions, tabs, toolbar, updateScrollState])

  const scrollByStep = (direction: 'left' | 'right') => {
    const element = scrollRef.current
    if (!element) return

    const step = Math.max(220, Math.round(element.clientWidth * 0.45))
    element.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    })
  }

  const handleHorizontalWheel = (event: WheelEvent<HTMLDivElement>) => {
    const element = scrollRef.current
    if (!element || !hasHorizontalOverflow) return
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

    element.scrollLeft += event.deltaY
    event.preventDefault()
  }

  const content = (
    <div
      className={cn(
        tabs
          ? 'grid grid-cols-[auto_auto_auto] items-center'
          : 'flex flex-row items-center justify-between',
        'h-14 min-w-max gap-2 px-1 md:w-full md:min-w-max lg:gap-4'
      )}
    >
      <div className="flex w-fit shrink-0 items-center gap-3 justify-self-start">
        <h1 className="whitespace-nowrap text-base font-sans font-semibold text-dark-gray">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {tabs && (
        <div className="flex min-w-fit items-center justify-center justify-self-center px-1 md:min-w-[220px] md:px-2">
          {tabs}
        </div>
      )}

      {toolbar && (
        <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end">
          {toolbar}
        </div>
      )}
    </div>
  )

  return (
    <header className={cn('sticky top-0 z-20 w-full min-w-0 max-w-full shrink-0 overflow-hidden border-b border-border bg-white', className)}>
      <div
        ref={scrollRef}
        onWheel={handleHorizontalWheel}
        className={cn(
          'w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          hasHorizontalOverflow
            ? cn(canScrollLeft ? 'pl-8' : 'pl-1', canScrollRight ? 'pr-8' : 'pr-1')
            : 'px-1'
        )}
      >
        {content}
      </div>

      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute bottom-2 left-0 top-2 z-10 w-12 bg-gradient-to-r from-white via-white/95 to-transparent" />
          <div className="absolute bottom-2 left-1 top-2 z-20 flex items-center">
            <button
              type="button"
              aria-label="Przewiń w lewo"
              onClick={() => scrollByStep('left')}
              className="inline-flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-slate-950"
            >
              <MdChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </>
      )}

      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute bottom-2 right-0 top-2 z-10 w-12 bg-gradient-to-l from-white via-white/95 to-transparent" />
          <div className="absolute bottom-2 right-1 top-2 z-20 flex items-center">
            <button
              type="button"
              aria-label="Przewiń w prawo"
              onClick={() => scrollByStep('right')}
              className="inline-flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-slate-950"
            >
              <MdChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </header>
  )
}
