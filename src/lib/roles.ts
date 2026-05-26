export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const isAdmin = (role?: string | null): boolean => role === ROLES.ADMIN

// Manager + Admin
export const isManager = (role?: string | null): boolean =>
  role === ROLES.ADMIN || role === ROLES.MANAGER

// Accessible to all logged-in roles
export const isStaff = (role?: string | null): boolean =>
  role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.USER

export const canManageUsers = isAdmin

export const canAccessMenu = isManager

export const canAccessFullDashboard = isManager

export const canAccessFullSettings = isManager

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'Kelner',
}
