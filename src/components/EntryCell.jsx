export default function EntryCell({ entry, date, isToday, isWeekend, onTap }) {
  const bg = isToday ? 'bg-today' : isWeekend ? 'bg-weekend' : 'bg-white'
  const hasContent = entry && entry.content

  return (
    <button
      onClick={onTap}
      className={`${bg} border border-t-0 border-l-0 border-[#e2e8f0] p-1.5 text-left min-h-[44px] w-full active:bg-indigo-50 transition relative`}
    >
      {hasContent ? (
        <span
          className={`text-[13px] leading-tight block ${
            entry.is_complete ? 'line-through text-gray-400' : entry._isPlaceholder ? 'text-gray-400 italic' : 'text-gray-800'
          }`}
        >
          {entry.is_test && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-test mr-1 align-middle" />
          )}
          {entry.content.length > 30 ? entry.content.slice(0, 30) + '...' : entry.content}
        </span>
      ) : (
        <span className="text-[13px] text-gray-300 opacity-0 hover:opacity-100 transition">+</span>
      )}
    </button>
  )
}
