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
    { label: 'Projects', value: totalProjects, color: 'from-cyan-500 to-cyan-600 text-cyan-100', bgColor: 'bg-cyan-500/10' },
    { label: 'To Do', value: countByStatus('TODO'), color: 'from-slate-400 to-slate-500 text-slate-100', bgColor: 'bg-slate-500/10' },
    { label: 'In Progress', value: countByStatus('IN_PROGRESS'), color: 'from-purple-500 to-purple-600 text-purple-100', bgColor: 'bg-purple-500/10' },
    { label: 'Done', value: countByStatus('DONE'), color: 'from-emerald-500 to-emerald-600 text-emerald-100', bgColor: 'bg-emerald-500/10' },
    ...(isAdmin && totalUsers !== null ? [{ label: 'Users', value: totalUsers, color: 'from-pink-500 to-pink-600 text-pink-100', bgColor: 'bg-pink-500/10' }] : []),
  ]

  return (
    <div className="p-8">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Good {getGreeting()}, {session.name.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-2">Here&apos;s what&apos;s happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s, i) => (
          <div 
            key={s.label} 
            className="glass rounded-2xl border border-slate-700/50 p-6 hover-lift group cursor-pointer"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} ${s.bgColor} mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-xl">
                {s.label === 'Projects' && '📁'}
                {s.label === 'To Do' && '📝'}
                {s.label === 'In Progress' && '⚡'}
                {s.label === 'Done' && '✅'}
                {s.label === 'Users' && '👥'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-2">{s.label}</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden hover-lift">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
            <h2 className="font-semibold text-slate-100 flex items-center gap-2">
              <span>⚠️</span> Overdue Tasks
            </h2>
            <span className="text-xs font-bold text-red-300 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
              {overdueTasks.length} tasks
            </span>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">No overdue tasks 🎉</div>
          ) : (
            <ul className="divide-y divide-slate-700/30">
              {overdueTasks.map((task, i) => (
                <li key={task.id} className="px-6 py-4 flex items-start gap-3 hover:bg-slate-700/20 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      <Link href={`/projects/${task.project.id}`} className="text-cyan-400 hover:text-cyan-300">
                        {task.project.name}
                      </Link>
                      {task.assignee && <span className="text-slate-500"> · {task.assignee.name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded">
                      {task.dueDate ? formatDate(task.dueDate) : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden hover-lift">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
            <h2 className="font-semibold text-slate-100 flex items-center gap-2">
              <span>✨</span> Recent Tasks
            </h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">No tasks yet.</div>
          ) : (
            <ul className="divide-y divide-slate-700/30">
              {recentTasks.map((task, i) => (
                <li key={task.id} className="px-6 py-4 flex items-start gap-3 hover:bg-slate-700/20 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      <Link href={`/projects/${task.project.id}`} className="text-cyan-400 hover:text-cyan-300">
                        {task.project.name}
                      </Link>
                      {task.assignee && <span className="text-slate-500"> · {task.assignee.name}</span>}
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
