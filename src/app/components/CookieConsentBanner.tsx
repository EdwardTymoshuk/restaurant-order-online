'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Cookie } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const CONSENT_KEY = 'spoko_cookie_consent'
const VISITOR_KEY = 'spoko_visitor_id'
const SESSION_KEY = 'spoko_session_id'
const CONSENT_VERSION = '2026-08-16-v2'
const DEFAULT_ENDPOINT = '/api/public/analytics/track'

type ConsentState = {
  necessary: true
  analytics: boolean
  marketing: boolean
  version: string
  updatedAt: string
}

const defaultConsent = (overrides: Partial<ConsentState> = {}): ConsentState => ({
  necessary: true,
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
  updatedAt: new Date().toISOString(),
  ...overrides,
})

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
  return value ? decodeURIComponent(value) : null
}

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 180
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const domain = window.location.hostname.endsWith('spokosopot.pl') ? '; Domain=.spokosopot.pl' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}${domain}`
}

function readConsent() {
  try {
    const raw = getCookie(CONSENT_KEY) || localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function saveConsent(consent: ConsentState) {
  const raw = JSON.stringify(consent)
  localStorage.setItem(CONSENT_KEY, raw)
  setCookie(CONSENT_KEY, raw)
  window.dispatchEvent(new CustomEvent('spoko-consent-changed', { detail: consent }))
}

function getStoredId(key: string) {
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const next =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(key, next)
  return next
}

function isAdminSurface() {
  if (typeof window === 'undefined') return true
  return window.location.hostname.startsWith('admin.') || window.location.pathname.startsWith('/admin-panel')
}

function AnalyticsTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams?.toString() ?? ''
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || DEFAULT_ENDPOINT

  useEffect(() => {
    if (!enabled || isAdminSurface()) return

    const payload = {
      eventName: 'page_view',
      path: `${pathname || '/'}${queryString ? `?${queryString}` : ''}`,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      visitorId: getStoredId(VISITOR_KEY),
      sessionId: getStoredId(SESSION_KEY),
    }

    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined)
  }, [enabled, endpoint, pathname, queryString])

  return null
}

function ConsentToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked)
      }}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
        checked ? 'bg-primary' : 'bg-slate-300'
      } ${checked ? 'justify-end' : 'justify-start'} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      <span className="block h-4 w-4 rounded-full bg-white shadow-sm" />
    </button>
  )
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false)
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [draft, setDraft] = useState(defaultConsent())

  useEffect(() => {
    setMounted(true)
    const saved = readConsent()
    setConsent(saved)
    setDraft(saved ?? defaultConsent())
  }, [])

  const shouldHide = useMemo(() => mounted && isAdminSurface(), [mounted])

  if (!mounted || shouldHide) return null

  const persist = (next: ConsentState) => {
    saveConsent(next)
    setConsent(next)
    setDraft(next)
    setPreferencesOpen(false)
  }

  const acceptAll = () => persist(defaultConsent({ analytics: true, marketing: true }))
  const rejectOptional = () => persist(defaultConsent({ analytics: false, marketing: false }))
  const handlePreferencesOpenChange = (open: boolean) => {
    if (open) {
      setPreferencesOpen(true)
      return
    }

    rejectOptional()
  }

  return (
    <>
      <AnalyticsTracker enabled={consent?.analytics === true} />

      {!consent && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-xl border border-border bg-white/95 p-3 shadow-xl shadow-secondary/15 backdrop-blur sm:bottom-4 sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-950">Pliki cookies</p>
              <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
                Korzystamy z cookies, żeby strona działała wygodnie i sprawnie. Jeśli się zgodzisz, użyjemy ich też do lepszego dopasowania treści i rozwijania serwisu.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Button
                variant="outline"
                className="border-secondary bg-secondary text-white hover:bg-secondary/90 hover:text-white"
                onClick={rejectOptional}
              >
                Tylko wymagane
              </Button>
              <Button variant="outline" onClick={() => setPreferencesOpen(true)}>Ustawienia</Button>
              <Button onClick={acceptAll}>Akceptuję</Button>
            </div>
          </div>
        </div>
      )}

      {consent && (
        <button
          type="button"
          onClick={() => {
            setDraft(consent)
            setPreferencesOpen(true)
          }}
          className="fixed bottom-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-slate-500 shadow-sm ring-1 ring-border/70 backdrop-blur transition hover:bg-white hover:text-slate-800"
          aria-label="Ustawienia cookies"
          title="Ustawienia cookies"
        >
          <Cookie size={17} />
        </button>
      )}

      <Dialog open={preferencesOpen} onOpenChange={handlePreferencesOpenChange}>
        <DialogContent className="max-w-xl focus:outline-none focus-visible:outline-none">
          <DialogHeader>
            <DialogTitle>Preferencje cookies</DialogTitle>
            <DialogDescription>
              Ty decydujesz, na co się zgadzasz. Wymagane cookies pozostają włączone, bo bez nich strona nie działałaby poprawnie.
            </DialogDescription>
            <a href="/privacy-policy" className="pt-1 text-sm font-medium text-primary hover:underline">
              Dowiedz się więcej w polityce prywatności
            </a>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-950">Wymagane</p>
                  <p className="mt-1 text-sm text-muted-foreground">Są potrzebne do działania strony i zamówień online, dlatego nie można ich wyłączyć w tym panelu.</p>
                </div>
                <ConsentToggle checked onChange={() => undefined} disabled />
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-950">Statystyki</p>
                  <p className="mt-1 text-sm text-muted-foreground">Pomagają nam zobaczyć, co Cię najbardziej interesuje, żebyśmy mogli rozwijać stronę w dobrym kierunku.</p>
                </div>
                <ConsentToggle checked={draft.analytics} onChange={(analytics) => setDraft({ ...draft, analytics })} />
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-950">Marketingowe</p>
                  <p className="mt-1 text-sm text-muted-foreground">Dzięki nim pokazujemy Ci treści i oferty dopasowane do Twoich zainteresowań, zamiast przypadkowych reklam.</p>
                </div>
                <ConsentToggle checked={draft.marketing} onChange={(marketing) => setDraft({ ...draft, marketing })} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="border-secondary bg-secondary text-white hover:bg-secondary/90 hover:text-white"
              onClick={rejectOptional}
            >
              Tylko wymagane
            </Button>
            <Button variant="outline" onClick={() => persist(defaultConsent({ analytics: draft.analytics, marketing: draft.marketing }))}>
              Zapisz ustawienia
            </Button>
            <Button onClick={acceptAll}>Akceptuję wszystko</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
