'use client'

import { useTransition, useState } from 'react'
import { addMember } from '@/lib/actions/project'

export function AddMemberForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setMessage(null)

    startTransition(async () => {
      const result = await addMember(projectId, email.trim())
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Member added.' })
        setEmail('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="member@example.com"
        required
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {isPending ? 'Adding…' : 'Add'}
      </button>
      {message && (
        <span
          className={`self-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message.text}
        </span>
      )}
    </form>
  )
}
