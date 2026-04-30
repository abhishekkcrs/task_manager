'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../prisma'
import { getSession } from '../session'

export async function updateUserRole(userId: string, role: 'ADMIN' | 'MEMBER') {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath('/admin')
}

export async function deleteUser(userId: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  if (userId === session.userId) return

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/admin')
}
