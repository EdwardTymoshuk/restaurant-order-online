export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  ORDERS_VIEW: 'orders.view',
  ORDERS_MANAGE: 'orders.manage',
  RESERVATIONS_VIEW: 'reservations.view',
  RESERVATIONS_MANAGE: 'reservations.manage',
  MENU_VIEW: 'menu.view',
  MENU_MANAGE: 'menu.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard.view': 'Podgląd pulpitu',
  'orders.view': 'Podgląd zamówień',
  'orders.manage': 'Obsługa zamówień',
  'reservations.view': 'Podgląd rezerwacji',
  'reservations.manage': 'Obsługa rezerwacji',
  'menu.view': 'Podgląd menu',
  'menu.manage': 'Edycja menu',
  'settings.view': 'Podgląd ustawień',
  'settings.manage': 'Edycja ustawień',
}
export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

export const hasPermission = (role?: string | null, permissions?: unknown, permission?: Permission) => {
  if (role === ROLES.ADMIN) return true
  return Array.isArray(permissions) && !!permission && permissions.includes(permission)
}

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
