export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge'
import { TaskStatusForm } from '@/components/TaskStatusForm'
import { DeleteButton } from '@/components/DeleteButton'
import { AddMemberForm } from '@/components/AddMemberForm'
import { deleteTask } from '@/lib/actions/task'
import { deleteProject, removeMember } from '@/lib/actions/project'

type PageProps = { params: Promise<{ id: string }> }

export default async function ProjectPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) notFound()

  const isMember = project.members.some((m) => m.userId === session.userId)
  const isOwner = project.ownerId === session.userId
  const isAdmin = session.role === 'ADMIN'

  if (!isMember && !isAdmin) redirect('/projects')

  const todoTasks = project.tasks.filter((t) => t.status === 'TODO')
  const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS')
  const doneTasks = project.tasks.filter((t) => t.status === 'DONE')

  const canManage = isOwner || isAdmin

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-500 mt-1">{project.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">Owner: {project.owner.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/projects/${project.id}/tasks/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </Link>
            {canManage && (
              <DeleteButton
                onDelete={deleteProject.bind(null, project.id)}
                confirmMessage={`Delete project "${project.name}" and all its tasks?`}
                label="Delete Project"
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium"
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {[
          { label: 'To Do', count: todoTasks.length, color: 'text-gray-600' },
          { label: 'In Progress', count: inProgressTasks.length, color: 'text-blue-600' },
          { label: 'Done', count: doneTasks.length, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-4 py-2.5">
            <span className={`text-xl font-bold ${s.color}`}>{s.count}</span>
            <span className="text-sm text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Kanban columns */}
        {[
          { label: 'To Do', tasks: todoTasks, status: 'TODO' as const },
          { label: 'In Progress', tasks: inProgressTasks, status: 'IN_PROGRESS' as const },
          { label: 'Done', tasks: doneTasks, status: 'DONE' as const },
        ].map((col) => (
          <div key={col.status} className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={col.status} />
                <span className="text-sm text-gray-400 font-medium">{col.tasks.length}</span>
              </div>
            </div>
            <div className="p-3 space-y-2.5">
              {col.tasks.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No tasks here</p>
              )}
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <TaskStatusForm
                      taskId={task.id}
                      projectId={project.id}
                      currentStatus={task.status}
                    />
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="text-xs text-gray-400">{task.assignee.name}</span>
                      )}
                      {canManage && (
                        <DeleteButton
                          onDelete={deleteTask.bind(null, task.id, project.id)}
                          confirmMessage={`Delete task "${task.title}"?`}
                          className="!text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Members section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Members ({project.members.length})</h2>
        </div>
        <div className="p-6">
          {canManage && (
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Add member by email</p>
              <AddMemberForm projectId={project.id} />
            </div>
          )}
          <ul className="space-y-2">
            {project.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 capitalize">{m.role.toLowerCase()}</span>
                  {canManage && m.userId !== session.userId && (
                    <DeleteButton
                      onDelete={removeMember.bind(null, project.id, m.userId)}
                      confirmMessage={`Remove ${m.user.name} from this project?`}
                      label="Remove"
                      className="!text-xs"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
}
