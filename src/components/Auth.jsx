import { useState } from 'react'

export default function Auth({ onSignIn, onSignUp }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (isSignUp) {
      const { error } = await onSignUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await onSignIn(email, password)
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="text-2xl font-bold text-navy text-center mb-1">Family Tracker</h1>
        <p className="text-sm text-slate text-center mb-6">Alberts weekly planner</p>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-5 gap-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!isSignUp ? 'bg-white text-navy shadow-sm' : 'text-slate'}`}
            onClick={() => setIsSignUp(false)}
          >
            Sign in
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${isSignUp ? 'bg-white text-navy shadow-sm' : 'text-slate'}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {error && <p className="text-sm text-test text-center mt-3">{error}</p>}
        {message && <p className="text-sm text-complete text-center mt-3">{message}</p>}
      </div>
    </div>
  )
}
