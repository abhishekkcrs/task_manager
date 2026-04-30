'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './prisma'
import { createSession, deleteSession } from './session'

const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).trim(),
  email: z.string().email({ message: 'Invalid email address.' }).trim(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export type AuthState =
  | { errors?: { name?: string[]; email?: string[]; password?: string[]; role?: string[] }; message?: string }
  | undefined

export async function login(state: AuthState, formData: FormData): Promise<AuthState> {
  const result = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { email, password } = result.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { message: 'Invalid email or password.' }
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role })
  redirect('/dashboard')
}

export async function register(state: AuthState, formData: FormData): Promise<AuthState> {
  const result = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role') ?? 'MEMBER',
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { name, email, password, role } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ['An account with this email already exists.'] } }
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  })

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role })
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
