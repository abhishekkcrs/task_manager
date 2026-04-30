export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { AdminUserActions } from './UserActions'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { ownedProjects: true, assignedTasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="mb-10 animate-slide-up">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="text-slate-400 mt-2">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden hover-lift">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/30 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                User
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Role
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Projects
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Tasks
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-slate-900 text-sm font-bold flex items-center justify-center shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">
                        {user.name}
                        {user.id === session.userId && (
                          <span className="ml-2 text-xs text-cyan-400 font-medium">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 ring-purple-500/30'
                        : 'bg-slate-500/20 text-slate-300 ring-slate-500/30'
                    }`}
                  >
                    {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300 font-medium">{user._count.ownedProjects}</td>
                <td className="px-6 py-4 text-slate-300 font-medium">{user._count.assignedTasks}</td>
                <td className="px-6 py-4">
                  <AdminUserActions
                    userId={user.id}
                    currentRole={user.role}
                    isSelf={user.id === session.userId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
