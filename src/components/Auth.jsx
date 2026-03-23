import { useState } from 'react'

export default function Auth({ onSignIn, onSignUp, onSendOtp, onVerifyOtp, onResetPassword }) {
  const [tab, setTab] = useState('signin') // signin | signup | code
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Reset state
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await onSignIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await onSignUp(email, password)
    if (error) setError(error.message)
    else setMessage('Account created! You can now sign in.')
    setLoading(false)
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await onSendOtp(otpEmail)
    if (error) { setError(error.message); setLoading(false); return }
    setOtpSent(true)
    setMessage('Code sent! Check your email.')
    setLoading(false)
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await onVerifyOtp(otpEmail, otpCode)
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await onResetPassword(resetEmail)
    if (error) setError(error.message)
    else setMessage('Check your email for a password reset link!')
    setLoading(false)
  }

  const switchTab = (t) => {
    setTab(t)
    setError('')
    setMessage('')
    setShowReset(false)
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="text-2xl font-bold text-navy text-center mb-1">Family Tracker</h1>
        <p className="text-sm text-slate text-center mb-6">Alberts weekly planner</p>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5 gap-1">
          {[['signin', 'Sign in'], ['signup', 'Sign up'], ['code', 'Email code']].map(([key, label]) => (
            <button
              key={key}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === key ? 'bg-white text-navy shadow-sm' : 'text-slate'}`}
              onClick={() => switchTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sign in */}
        {tab === 'signin' && !showReset && (
          <form onSubmit={handleSignIn} className="space-y-3">
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
              autoComplete="current-password"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setShowReset(true); setResetEmail(email); setError(''); setMessage('') }}
              className="w-full text-sm text-slate hover:text-navy transition"
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* Forgot password */}
        {tab === 'signin' && showReset && (
          <form onSubmit={handleReset} className="space-y-3">
            <p className="text-sm text-slate mb-1">Enter your email to receive a reset link.</p>
            <input
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy"
              autoComplete="email"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => { setShowReset(false); setError(''); setMessage('') }}
              className="w-full text-sm text-slate hover:text-navy transition"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* Sign up */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
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
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy"
              autoComplete="new-password"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        )}

        {/* Email code (OTP) */}
        {tab === 'code' && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendCode} className="space-y-3">
                <p className="text-sm text-slate mb-1">Sign in with a one-time code — no password needed.</p>
                <input
                  type="email"
                  placeholder="Email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy"
                  autoComplete="email"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
                >
                  {loading ? 'Sending...' : 'Send code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <p className="text-sm text-slate mb-1">Enter the 6-digit code sent to <span className="font-medium text-navy">{otpEmail}</span></p>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:border-navy"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); setMessage('') }}
                  className="w-full text-sm text-slate hover:text-navy transition"
                >
                  Use a different email
                </button>
              </form>
            )}
          </>
        )}

        {error && <p className="text-sm text-test text-center mt-3">{error}</p>}
        {message && <p className="text-sm text-complete text-center mt-3">{message}</p>}
      </div>
    </div>
  )
}
