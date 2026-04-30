'use client'

import { useTransition } from 'react'
import { updateTaskStatus } from '@/lib/actions/task'

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE'

const options: { value: Status; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
]

export function TaskStatusForm({
  taskId,
  projectId,
  currentStatus,
}: {
  taskId: string
  projectId: string
  currentStatus: Status
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as Status
    startTransition(() => updateTaskStatus(taskId, newStatus, projectId))
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
