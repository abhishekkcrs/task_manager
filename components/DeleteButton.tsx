'use client'

import { useTransition } from 'react'

export function DeleteButton({
  onDelete,
  label = 'Delete',
  confirmMessage = 'Are you sure?',
  className = '',
}: {
  onDelete: () => Promise<void>
  label?: string
  confirmMessage?: string
  className?: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(confirmMessage)) return
    startTransition(() => onDelete())
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-red-600 hover:text-red-800 disabled:opacity-50 text-sm font-medium transition-colors ${className}`}
    >
      {isPending ? 'Deleting…' : label}
    </button>
  )
}
