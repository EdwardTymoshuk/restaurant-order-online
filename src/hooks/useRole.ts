'use client'

import { isAdmin, isManager, type Role } from '@/lib/roles'
import { useSession } from 'next-auth/react'

export const useRole = (): Role | undefined => {
  const { data: session } = useSession()
  return session?.user?.role as Role | undefined
}

export const useIsAdmin = (): boolean => {
  const role = useRole()
  return isAdmin(role)
}

export const useIsManager = (): boolean => {
  const role = useRole()
  return isManager(role)
}
