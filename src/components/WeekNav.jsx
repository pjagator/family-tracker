export default function WeekNav({ weekDates, onPrev, onNext, onToday }) {
  if (!weekDates.length) return null

  const start = new Date(weekDates[0] + 'T00:00:00')
  const end = new Date(weekDates[6] + 'T00:00:00')

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = start.getFullYear()

  return (
    <div className="bg-navy text-white px-4 py-3 flex items-center justify-between">
      <button onClick={onPrev} className="p-2 -ml-2 active:opacity-60 text-lg">&larr;</button>
      <div className="text-center">
        <div className="text-base font-bold">{fmt(start)} &ndash; {fmt(end)}, {year}</div>
        <button onClick={onToday} className="text-xs text-indigo-200 active:text-white mt-0.5">
          Today
        </button>
      </div>
      <button onClick={onNext} className="p-2 -mr-2 active:opacity-60 text-lg">&rarr;</button>
    </div>
  )
}
