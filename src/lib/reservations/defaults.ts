import { ReservationDraft } from './types'

export const DEFAULT_RESERVATION_DRAFT: ReservationDraft = {
  step: 'welcome',
  extras: [],
  subtotal: 0,
  serviceFee: 0,
  total: 0,
  updatedAt: new Date().toISOString(),
}
