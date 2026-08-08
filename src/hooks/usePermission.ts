'use client'

import { hasPermission, type Permission } from '@/lib/roles'
import { useSession } from 'next-auth/react'

export const useHasPermission = (permission: Permission) => {
  const { data: session } = useSession()
  return hasPermission(session?.user?.role, session?.user?.permissions, permission)
}
