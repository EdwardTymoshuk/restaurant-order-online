'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 6) return setError('Hasło musi mieć co najmniej 6 znaków.')
    if (password !== confirmation) return setError('Hasła nie są takie same.')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setMessage(data.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Nie udało się zmienić hasła.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-8">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="space-y-5"><Image src="/img/logo-admin.svg" alt="Spoko" width={120} height={63} className="h-auto w-28" /><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Odzyskiwanie dostępu</p><CardTitle className="mt-2 text-2xl">Ustaw nowe hasło</CardTitle></div></CardHeader>
        <CardContent>
          {message ? <div className="space-y-4"><p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{message}</p><Link href="/admin-panel/auth/login" className="block text-center text-sm font-medium text-primary hover:underline">Przejdź do logowania</Link></div> : (
            <form onSubmit={submit} className="space-y-4">
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nowe hasło" autoComplete="new-password" required />
              <Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Powtórz nowe hasło" autoComplete="new-password" required />
              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={!token || loading}>{loading ? 'Zapisywanie...' : 'Ustaw nowe hasło'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
