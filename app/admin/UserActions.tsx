'use client'

import { useTransition } from 'react'
import { updateUserRole, deleteUser } from '@/lib/actions/admin'

export function AdminUserActions({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string
  currentRole: 'ADMIN' | 'MEMBER'
  isSelf: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleRoleToggle() {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    startTransition(() => updateUserRole(userId, newRole))
  }

  function handleDelete() {
    if (!confirm('Permanently delete this user and all their data?')) return
    startTransition(() => deleteUser(userId))
  }

  if (isSelf) {
    return <span className="text-xs text-gray-400 text-right block">—</span>
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={handleRoleToggle}
        disabled={isPending}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
      >
        {currentRole === 'ADMIN' ? 'Make Member' : 'Make Admin'}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
      >
        Delete
      </button>
    </div>
  )
}
