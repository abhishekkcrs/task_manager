const statusConfig = {
  TODO: { label: 'To Do', classes: 'bg-gray-100 text-gray-700 ring-gray-300' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 ring-blue-300' },
  DONE: { label: 'Done', classes: 'bg-green-50 text-green-700 ring-green-300' },
}

const priorityConfig = {
  LOW: { label: 'Low', classes: 'bg-green-50 text-green-700 ring-green-300' },
  MEDIUM: { label: 'Medium', classes: 'bg-amber-50 text-amber-700 ring-amber-300' },
  HIGH: { label: 'High', classes: 'bg-red-50 text-red-700 ring-red-300' },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const { label, classes } = statusConfig[status] ?? statusConfig.TODO
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: keyof typeof priorityConfig }) {
  const { label, classes } = priorityConfig[priority] ?? priorityConfig.MEDIUM
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {label}
    </span>
  )
}
