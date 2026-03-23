export default function EntryCell({ entry, date, isToday, isWeekend, dimmed, onTap, rowBgClass }) {
  const hasContent = entry && entry.content

  // Background: dimmed > today > weekend > alternating row bg > white
  let bg = dimmed ? 'bg-slate-100'
    : isToday ? 'bg-today'
    : isWeekend ? 'bg-weekend'
    : rowBgClass || 'bg-white'

  // Left border accent: test > complete > today
  let leftBorder = ''
  if (entry?.is_test) {
    leftBorder = 'border-l-[3px] border-l-orange-400'
  } else if (entry?.is_complete) {
    leftBorder = 'border-l-[3px] border-l-complete'
  } else if (isToday && !dimmed) {
    leftBorder = 'border-l-2 border-l-today-border'
  }

  return (
    <button
      onClick={onTap}
      className={`${bg} border border-slate-300 p-1.5 text-left min-h-[44px] w-full transition-colors relative ${leftBorder} active:bg-indigo-50 active:scale-[0.97]`}
    >
      {hasContent ? (
        <span
          className={`text-[13px] leading-tight block ${
            entry.is_complete
              ? 'line-through text-gray-400'
              : entry._isAutoSpecial
                ? 'text-gray-500 font-medium italic'
                : entry._isPlaceholder
                  ? 'text-gray-400 italic'
                  : 'text-gray-800'
          }`}
        >
          {entry.is_test && (
            <span className="inline-block text-[10px] font-bold text-orange-500 mr-1 align-middle">TEST</span>
          )}
          {entry.is_complete && (
            <span className="inline-block text-[10px] mr-1 align-middle">✓</span>
          )}
          {entry.content.length > 30 ? entry.content.slice(0, 30) + '…' : entry.content}
        </span>
      ) : (
        <span className={`text-[16px] text-gray-300 ${dimmed ? 'opacity-20' : 'opacity-30'}`}>+</span>
      )}
    </button>
  )
}
