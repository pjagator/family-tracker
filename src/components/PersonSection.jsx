import { useState } from 'react'

export default function PersonSection({ name, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 active:bg-gray-100 transition"
      >
        <span className="text-base font-semibold text-navy">{name}</span>
        <span className={`text-slate text-xs transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}
