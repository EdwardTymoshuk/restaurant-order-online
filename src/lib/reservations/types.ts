import { Prisma } from '@prisma/client'
import { EventType, PackageCode, ReservationExtraType } from './enums'

/**
 * Single extra selected in reservation wizard.
 * Used for price calculation and final snapshot creation.
 */
export interface ReservationDraftExtra {
  type: ReservationExtraType
  label: string
  quantity: number
  unitPrice: number
  metadata?: Prisma.InputJsonValue
}

/**
 * Draft state of reservation stored in localStorage.
 * This object MUST NOT contain personal or sensitive data.
 */
export interface ReservationDraft {
  /** Wizard state */
  step: string

  /** Event basics */
  eventDate?: string // ISO date: YYYY-MM-DD
  startTime?: string // HH:mm
  adultsCount?: number
  childrenCount?: number
  eventType?: EventType

  /** Package */
  packageCode?: PackageCode
  servingType?: string // plated | sharing | combo (string on purpose)

  /** Extras */
  extras: ReservationDraftExtra[]

  /** Pricing */
  subtotal: number
  serviceFee: number
  total: number

  /** Metadata */
  updatedAt: string // ISO timestamp
}
