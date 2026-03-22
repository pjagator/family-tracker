const TABS = [
  { key: 'week', label: 'Week', icon: '📅' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {TABS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onNavigate(key)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 ${
            active === key ? 'text-navy' : 'text-slate'
          }`}
        >
          <span className="text-xl">{icon}</span>
          <span className={`text-[11px] ${active === key ? 'font-bold' : 'font-medium'}`}>{label}</span>
        </button>
      ))}
    </nav>
  )
}
