'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setMessage(data.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Nie udało się wysłać wiadomości.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="space-y-5">
          <Image src="/img/logo-admin.svg" alt="Spoko" width={120} height={63} className="h-auto w-28" />
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Odzyskiwanie dostępu</p><CardTitle className="mt-2 text-2xl">Reset hasła</CardTitle></div>
        </CardHeader>
        <CardContent>
          {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{message}</p> : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">Podaj email przypisany do konta. Wyślemy na niego instrukcję resetu hasła.</p>
              <Input type="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Adres email" autoComplete="email" required />
              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}</Button>
            </form>
          )}
          <Link href="/admin-panel/auth/login" className="mt-5 block text-center text-sm font-medium text-primary hover:underline">Wróć do logowania</Link>
        </CardContent>
      </Card>
    </div>
  )
}
