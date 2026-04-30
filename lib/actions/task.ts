'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '../prisma'
import { getSession } from '../session'

const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().trim().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

export type TaskState =
  | {
      errors?: {
        title?: string[]
        description?: string[]
        status?: string[]
        priority?: string[]
        dueDate?: string[]
        assigneeId?: string[]
      }
      message?: string
    }
  | undefined

export async function createTask(
  projectId: string,
  state: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    status: formData.get('status') || 'TODO',
    priority: formData.get('priority') || 'MEDIUM',
    dueDate: formData.get('dueDate') || undefined,
    assigneeId: formData.get('assigneeId') || undefined,
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { dueDate, assigneeId, ...rest } = result.data

  await prisma.task.create({
    data: {
      ...rest,
      projectId,
      createdById: session.userId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeId: assigneeId || undefined,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function updateTask(
  taskId: string,
  projectId: string,
  state: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    status: formData.get('status') || 'TODO',
    priority: formData.get('priority') || 'MEDIUM',
    dueDate: formData.get('dueDate') || undefined,
    assigneeId: formData.get('assigneeId') || undefined,
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { dueDate, assigneeId, ...rest } = result.data

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function updateTaskStatus(
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  projectId: string,
) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.task.update({ where: { id: taskId }, data: { status } })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}

export async function deleteTask(taskId: string, projectId: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}
