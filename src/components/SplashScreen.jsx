import { useState, useEffect } from 'react'

// Brownie SVG (chocolate poodle, larger)
export function BrownieSvg() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <ellipse cx="40" cy="60" rx="22" ry="18" fill="#8B5E3C"/>
      <circle cx="40" cy="32" r="16" fill="#8B5E3C"/>
      <circle cx="24" cy="28" r="10" fill="#6D4C2A"/>
      <circle cx="56" cy="28" r="10" fill="#6D4C2A"/>
      <circle cx="40" cy="18" r="10" fill="#6D4C2A"/>
      <ellipse cx="40" cy="38" rx="6" ry="4" fill="#7A5232"/>
      <circle cx="40" cy="36" r="2.5" fill="#2a1a0a"/>
      <circle cx="34" cy="30" r="2" fill="#2a1a0a"/>
      <circle cx="46" cy="30" r="2" fill="#2a1a0a"/>
      <circle cx="35" cy="29" r="0.8" fill="white"/>
      <circle cx="47" cy="29" r="0.8" fill="white"/>
      <rect x="26" y="72" width="7" height="14" rx="3" fill="#8B5E3C"/>
      <rect x="47" y="72" width="7" height="14" rx="3" fill="#8B5E3C"/>
      <circle cx="29" cy="82" r="5" fill="#6D4C2A"/>
      <circle cx="51" cy="82" r="5" fill="#6D4C2A"/>
      <path d="M62,55 Q75,40 68,28" stroke="#8B5E3C" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="68" cy="28" r="6" fill="#6D4C2A"/>
    </svg>
  )
}

// Ursa Minor SVG (black poodle, smaller)
export function UrsaMinorSvg() {
  return (
    <svg width="65" height="75" viewBox="0 0 80 90">
      <ellipse cx="40" cy="60" rx="22" ry="18" fill="#2a2a2a"/>
      <circle cx="40" cy="32" r="16" fill="#2a2a2a"/>
      <circle cx="24" cy="28" r="10" fill="#1a1a1a"/>
      <circle cx="56" cy="28" r="10" fill="#1a1a1a"/>
      <circle cx="40" cy="18" r="10" fill="#1a1a1a"/>
      <ellipse cx="40" cy="38" rx="6" ry="4" fill="#222"/>
      <circle cx="40" cy="36" r="2.5" fill="#111"/>
      <circle cx="34" cy="30" r="2" fill="#ddd"/>
      <circle cx="46" cy="30" r="2" fill="#ddd"/>
      <circle cx="35" cy="29" r="0.8" fill="white"/>
      <circle cx="47" cy="29" r="0.8" fill="white"/>
      <rect x="26" y="72" width="7" height="14" rx="3" fill="#2a2a2a"/>
      <rect x="47" y="72" width="7" height="14" rx="3" fill="#2a2a2a"/>
      <circle cx="29" cy="82" r="5" fill="#1a1a1a"/>
      <circle cx="51" cy="82" r="5" fill="#1a1a1a"/>
      <path d="M62,55 Q75,40 68,28" stroke="#2a2a2a" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="68" cy="28" r="6" fill="#1a1a1a"/>
    </svg>
  )
}

export default function SplashScreen({ isReady, onComplete }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (isReady && !exiting) {
      setExiting(true)
      // Wait for run-off (0.4s) + fade (0.3s) to complete
      const timer = setTimeout(() => {
        onComplete()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isReady, exiting, onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy"
      style={exiting ? {
        animation: 'splashFadeOut 0.3s ease-out 0.4s forwards',
      } : undefined}
    >
      {/* Poodles */}
      <div className="flex items-end gap-6">
        {/* Brownie - runs left on exit */}
        <div
          style={exiting
            ? { animation: 'poodleRunLeft 0.4s ease-in forwards' }
            : { animation: 'poodleBounce 0.6s ease-in-out infinite alternate' }
          }
        >
          <BrownieSvg />
          <div className="text-center text-[10px] font-semibold mt-0.5" style={{ color: '#c4956a' }}>
            Brownie
          </div>
        </div>

        {/* Ursa Minor - runs right on exit */}
        <div
          style={exiting
            ? { animation: 'poodleRunRight 0.4s ease-in forwards' }
            : { animation: 'poodleBounce 0.6s 0.15s ease-in-out infinite alternate' }
          }
        >
          <UrsaMinorSvg />
          <div className="text-center text-[10px] font-semibold mt-0.5 text-gray-500">
            Ursa Minor
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-6 text-center">
        <div className="text-white text-xl font-bold tracking-wide">
          Alberts Family Tracker
        </div>
      </div>
    </div>
  )
}
