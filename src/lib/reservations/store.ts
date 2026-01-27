import { DEFAULT_RESERVATION_DRAFT } from './defaults'
import { ReservationDraft } from './types'

const STORAGE_KEY = 'spoko_reservation_draft'
const STORAGE_VERSION = 1

interface StoredReservationDraft {
  version: number
  data: ReservationDraft
}

/**
 * Safely read reservation draft from localStorage.
 * Falls back to default draft if data is missing or invalid.
 */
export const getReservationDraft = (): ReservationDraft => {
  if (typeof window === 'undefined') {
    return DEFAULT_RESERVATION_DRAFT
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_RESERVATION_DRAFT
    }

    const parsed: StoredReservationDraft = JSON.parse(raw)

    if (parsed.version !== STORAGE_VERSION) {
      return DEFAULT_RESERVATION_DRAFT
    }

    return parsed.data
  } catch {
    return DEFAULT_RESERVATION_DRAFT
  }
}

/**
 * Persist reservation draft to localStorage.
 * Automatically updates updatedAt timestamp.
 */
export const saveReservationDraft = (
  partial: Partial<ReservationDraft>
): ReservationDraft => {
  const current = getReservationDraft()

  const next: ReservationDraft = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  }

  const payload: StoredReservationDraft = {
    version: STORAGE_VERSION,
    data: next,
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  return next
}

/**
 * Update only the current wizard step.
 */
export const setReservationStep = (step: string): ReservationDraft => {
  return saveReservationDraft({ step })
}

/**
 * Remove reservation draft from localStorage.
 * Used after successful submission.
 */
export const resetReservationDraft = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
