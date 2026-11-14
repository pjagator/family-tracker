import { Component } from 'react'

// Catches a crash anywhere in the app and shows a way to recover, instead of
// the blank white screen React leaves behind by default.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
        <p className="text-lg font-bold text-navy mb-1">Something went wrong</p>
        <p className="text-sm text-slate mb-4">Your data is safe. Reloading usually fixes it.</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[44px] px-6 bg-navy text-white rounded-lg text-sm font-medium active:scale-[0.98] transition"
        >
          Reload
        </button>
        <p className="text-xs text-gray-400 mt-6 break-words max-w-full">
          {String(this.state.error?.message || this.state.error)}
        </p>
      </div>
    )
  }
}
