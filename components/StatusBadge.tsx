const statusConfig = {
  TODO: { label: 'To Do', classes: 'bg-slate-500/20 text-slate-300 ring-slate-500/30' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-purple-500/20 text-purple-300 ring-purple-500/30' },
  DONE: { label: 'Done', classes: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' },
}

const priorityConfig = {
  LOW: { label: 'Low', classes: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' },
  MEDIUM: { label: 'Medium', classes: 'bg-amber-500/20 text-amber-300 ring-amber-500/30' },
  HIGH: { label: 'High', classes: 'bg-red-500/20 text-red-300 ring-red-500/30' },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const { label, classes } = statusConfig[status] ?? statusConfig.TODO
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}>
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: keyof typeof priorityConfig }) {
  const { label, classes } = priorityConfig[priority] ?? priorityConfig.MEDIUM
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}>
      {label}
    </span>
  )
}
