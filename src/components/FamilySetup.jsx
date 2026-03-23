import { useState } from 'react'
import { useToast } from './ToastContext'

export default function FamilySetup({ onCreateFamily, onJoinFamily }) {
  const showToast = useToast()
  const [mode, setMode] = useState(null) // null, 'create', 'join'
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!familyName.trim()) return
    setLoading(true)
    const { error } = await onCreateFamily(familyName.trim())
    if (error) showToast({ message: 'Could not create family. Please try again.', type: 'error' })
    setLoading(false)
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setLoading(true)
    const { error } = await onJoinFamily(inviteCode.trim())
    if (error) showToast({ message: 'Invalid invite code. Check and try again.', type: 'error' })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="text-xl font-bold text-navy text-center mb-1">Welcome!</h1>
        <p className="text-sm text-slate text-center mb-6">
          Create a family or join one with an invite code.
        </p>

        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium active:scale-[0.98] transition"
            >
              Create a new family
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 border border-gray-200 rounded-lg text-sm text-navy font-medium active:bg-gray-50 transition"
            >
              Join with invite code
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Family name (e.g. Alberts)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {loading ? 'Creating...' : 'Create family'}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-2 text-sm text-slate active:text-navy transition"
            >
              Back
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy font-mono tracking-wider text-center"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {loading ? 'Joining...' : 'Join family'}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-2 text-sm text-slate active:text-navy transition"
            >
              Back
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
