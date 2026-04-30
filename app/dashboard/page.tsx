export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const isAdmin = session.role === 'ADMIN'

  const [totalProjects, totalUsers, taskCounts, overdueTasks, recentTasks] = await Promise.all([
    isAdmin
      ? prisma.project.count()
      : prisma.projectMember.count({ where: { userId: session.userId } }),

    isAdmin ? prisma.user.count() : null,

    prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: isAdmin ? {} : {
        project: { members: { some: { userId: session.userId } } },
      },
    }),

    prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'DONE' },
        ...(isAdmin ? {} : {
          project: { members: { some: { userId: session.userId } } },
        }),
      },
      include: { project: { select: { id: true, name: true } }, assignee: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),

    prisma.task.findMany({
      where: isAdmin ? {} : {
        project: { members: { some: { userId: session.userId } } },
      },
      include: { project: { select: { id: true, name: true } }, assignee: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const countByStatus = (status: string) =>
    taskCounts.find((t) => t.status === status)?._count ?? 0

  const stats = [
    { label: 'Projects', value: totalProjects, color: 'bg-blue-50 text-blue-700' },
    { label: 'To Do', value: countByStatus('TODO'), color: 'bg-gray-50 text-gray-700' },
    { label: 'In Progress', value: countByStatus('IN_PROGRESS'), color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Done', value: countByStatus('DONE'), color: 'bg-green-50 text-green-700' },
    ...(isAdmin && totalUsers !== null ? [{ label: 'Users', value: totalUsers, color: 'bg-purple-50 text-purple-700' }] : []),
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {session.name.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Overdue Tasks</h2>
            <span className="text-xs font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">
              {overdueTasks.length}
            </span>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No overdue tasks 🎉</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {overdueTasks.map((task) => (
                <li key={task.id} className="px-6 py-3.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Link href={`/projects/${task.project.id}`} className="hover:underline">
                        {task.project.name}
                      </Link>
                      {task.assignee && ` · ${task.assignee.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-red-500">
                      {task.dueDate ? formatDate(task.dueDate) : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No tasks yet.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentTasks.map((task) => (
                <li key={task.id} className="px-6 py-3.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Link href={`/projects/${task.project.id}`} className="hover:underline">
                        {task.project.name}
                      </Link>
                      {task.assignee && ` · ${task.assignee.name}`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={task.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
}
