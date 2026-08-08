'use client'

import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { ALL_PERMISSIONS, PERMISSION_LABELS, ROLE_LABELS, type Permission } from '@/lib/roles'
import { trpc } from '@/utils/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import AddUserDialog from './AddUserDialog'

type User = { id: string; username: string; email: string | null; name: string | null; role: string; permissions: unknown }

const UserList = () => {
  const queryClient = useQueryClient()
  const queryKey = getQueryKey(trpc.user.getAllUsers)
  const refetch = () => queryClient.invalidateQueries(queryKey)

  const { data: users, isLoading } = trpc.user.getAllUsers.useQuery()

  const deleteUser = trpc.user.deleteUser.useMutation({ onSuccess: refetch })
  const updateUser = trpc.user.updateUser.useMutation({
    onSuccess: () => { refetch(); setEditUser(null); toast.success('Zapisano zmiany.') },
  })
  const resetPassword = trpc.user.resetPassword.useMutation({
    onSuccess: () => { setPasswordUser(null); toast.success('Hasło zostało zmienione.') },
    onError: (e) => toast.error(e.message),
  })

  const [addOpen, setAddOpen] = useState(false)
  const [deleteUser_, setDeleteUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<'user' | 'manager' | 'admin'>('user')
  const [editPermissions, setEditPermissions] = useState<Permission[]>([])
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const openEdit = (u: User) => {
    setEditUser(u)
    setEditName(u.name ?? '')
    setEditEmail(u.email ?? '')
    setEditRole(u.role as 'user' | 'manager' | 'admin')
    setEditPermissions(Array.isArray(u.permissions) ? u.permissions as Permission[] : [])
  }

  const openPasswordReset = (u: User) => {
    setPasswordUser(u)
    setNewPassword('')
  }

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
            <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Email logowania</TableHead>
                <TableHead>Imię</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.name ?? '—'}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edytuj"
                        onClick={() => openEdit(user as User)}
                        className="h-8 w-8 text-slate-500 hover:text-slate-900"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Zmień hasło"
                        onClick={() => openPasswordReset(user as User)}
                        className="h-8 w-8 text-slate-500 hover:text-slate-900"
                      >
                        <KeyRound size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Usuń"
                        onClick={() => setDeleteUser(user as User)}
                        className="h-8 w-8 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Button className="mt-4" onClick={() => setAddOpen(true)}>Dodaj użytkownika</Button>

      {/* Dodaj użytkownika */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nowy użytkownik</DialogTitle></DialogHeader>
          <AddUserDialog onSuccess={() => { setAddOpen(false); refetch() }} />
        </DialogContent>
      </Dialog>

      {/* Edycja */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edytuj użytkownika</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Użytkownik</p>
              <p className="text-sm text-muted-foreground">{editUser?.username}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email logowania</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Imię</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Imię (opcjonalne)"
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Uprawnienia</p>
              <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                {ALL_PERMISSIONS.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" className="size-4 accent-primary" checked={editPermissions.includes(permission)} onChange={(event) => setEditPermissions((current) => event.target.checked ? [...current, permission] : current.filter((item) => item !== permission))} />
                    {PERMISSION_LABELS[permission]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Rola</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as typeof editRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Kelner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => updateUser.mutate({ userId: editUser!.id, name: editName || undefined, email: editEmail, role: editRole, permissions: editPermissions })}
              disabled={updateUser.isLoading}
            >
              Zapisz
            </Button>
            <Button variant="secondary" onClick={() => setEditUser(null)}>Anuluj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset hasła */}
      <Dialog open={!!passwordUser} onOpenChange={(o) => !o && setPasswordUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Zmień hasło</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ustawiasz nowe hasło dla: <strong>{passwordUser?.username}</strong>
            </p>
            <Input
              type="password"
              placeholder="Nowe hasło (min. 6 znaków)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => resetPassword.mutate({ userId: passwordUser!.id, newPassword })}
              disabled={newPassword.length < 6 || resetPassword.isLoading}
            >
              Zmień hasło
            </Button>
            <Button variant="secondary" onClick={() => setPasswordUser(null)}>Anuluj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Potwierdzenie usunięcia */}
      <Dialog open={!!deleteUser_} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Usuń użytkownika</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Czy na pewno chcesz usunąć konto <strong>{deleteUser_?.username}</strong>? Tej operacji nie można cofnąć.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="danger"
              onClick={() => { deleteUser.mutate({ userId: deleteUser_!.id }); setDeleteUser(null) }}
            >
              Usuń
            </Button>
            <Button variant="secondary" onClick={() => setDeleteUser(null)}>Anuluj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserList
