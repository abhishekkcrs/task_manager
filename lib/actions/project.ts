'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '../prisma'
import { getSession } from '../session'

const ProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  description: z.string().trim().optional(),
})

export type ProjectState =
  | { errors?: { name?: string[]; description?: string[] }; message?: string }
  | undefined

export async function createProject(state: ProjectState, formData: FormData): Promise<ProjectState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = ProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const project = await prisma.project.create({
    data: {
      ...result.data,
      ownerId: session.userId,
      members: {
        create: { userId: session.userId, role: 'ADMIN' },
      },
    },
  })

  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}

export async function updateProject(
  projectId: string,
  state: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = ProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  await prisma.project.update({ where: { id: projectId }, data: result.data })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { message: 'Project updated.' }
}

export async function deleteProject(projectId: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return

  if (project.ownerId !== session.userId && session.role !== 'ADMIN') {
    return
  }

  await prisma.project.delete({ where: { id: projectId } })
  revalidatePath('/projects')
  redirect('/projects')
}

export async function addMember(projectId: string, email: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: 'No user found with that email.' }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })
  if (existing) return { error: 'User is already a member.' }

  await prisma.projectMember.create({
    data: { projectId, userId: user.id, role: 'MEMBER' },
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function removeMember(projectId: string, userId: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  })

  revalidatePath(`/projects/${projectId}`)
}
