function clip(text, max) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function EntryCell({ entry, items = [], isToday, isWeekend, dimmed, onTap, rowBgClass }) {
  const hasContent = entry && entry.content
  const hasItems = items.length > 0
  const openTest = (entry?.is_test && !entry?.is_complete) || items.some(i => i.is_test && !i.is_complete)
  const allDone = (hasContent || hasItems)
    && (!hasContent || entry.is_complete)
    && items.every(i => i.is_complete)

  // Background: dimmed > today > weekend > alternating row bg > white
  let bg = dimmed && !hasItems ? 'bg-slate-100'
    : isToday ? 'bg-today'
    : isWeekend ? 'bg-weekend'
    : rowBgClass || 'bg-white'

  // Left border accent: test > complete > today
  let leftBorder = ''
  if (openTest || entry?.is_test) {
    leftBorder = 'border-l-[3px] border-l-orange-400'
  } else if (allDone) {
    leftBorder = 'border-l-[3px] border-l-complete'
  } else if (isToday && !dimmed) {
    leftBorder = 'border-l-2 border-l-today-border'
  }

  return (
    <button
      onClick={onTap}
      className={`${bg} border border-slate-300 p-1.5 text-left min-h-[44px] w-full transition-colors relative ${leftBorder} active:bg-indigo-50 active:scale-[0.97]`}
    >
      {hasContent && (
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
          {clip(entry.content, 30)}
        </span>
      )}

      {/* Items synced from a calendar feed */}
      {items.map((item) => (
        <span
          key={item.id}
          className={`text-[12px] leading-tight block ${hasContent ? 'mt-1' : ''} [&+&]:mt-1 ${
            item.is_complete ? 'line-through text-gray-400' : item.is_test ? 'text-test font-semibold' : 'text-gray-700'
          }`}
        >
          {item.is_test && !item.is_complete && (
            <span className="inline-block text-[10px] font-bold text-orange-500 mr-1 align-middle">TEST</span>
          )}
          {item.is_complete && <span className="inline-block text-[10px] mr-1 align-middle">✓</span>}
          {clip(item.content, 34)}
        </span>
      ))}

      {!hasContent && !hasItems && (
        <span className={`text-[16px] text-gray-400 ${dimmed ? 'opacity-20' : 'opacity-30'}`}>+</span>
      )}
    </button>
  )
}
