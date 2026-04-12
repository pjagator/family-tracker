import EntryCell from './EntryCell'

const ROWS = [
  { key: 'homework', label: 'Homework' },
  { key: 'specials', label: 'Specials' },
  { key: 'activities', label: 'Activities' },
]

const SPECIALS_ROTATION = {
  1: 'Music/PE',
  2: 'Spanish, Science',
  3: 'Music/PE',
  4: 'Spanish',
  5: 'Library Research',
  6: 'Art & PE',
  7: 'Science',
  8: 'Spanish, Science',
}

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function LuciaGrid({ weekDates, today, onCellTap, getEntry }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[600px]" style={{ gridTemplateColumns: '90px repeat(7, 1fr)' }}>
        {/* Header row */}
        <div className="bg-gray-50 border-r border-b border-gray-200 p-1.5 text-[11px] font-medium text-slate sticky left-0 z-10" />
        {weekDates.map((date, i) => {
          const d = new Date(date + 'T00:00:00')
          const dayNum = d.getDate()
          const isToday = date === today
          const isWeekend = i >= 5
          return (
            <div
              key={date}
              className={`border-r border-b border-gray-200 p-1.5 text-center text-[11px] font-medium ${
                isToday ? 'bg-today text-navy' : isWeekend ? 'bg-weekend text-slate' : 'bg-gray-50 text-slate'
              }`}
            >
              <div>{DAY_ABBRS[i]}</div>
              <div>{d.getMonth() + 1}/{dayNum}</div>
            </div>
          )
        })}

        {/* Category rows */}
        {ROWS.map(({ key, label }) => (
          <div key={key} className="contents">
            <div className="bg-gray-50 border-r border-b border-gray-200 p-1.5 text-[12px] font-medium text-navy-light sticky left-0 z-10 flex items-center">
              {label}
            </div>
            {weekDates.map((date, i) => {
              const entry = getEntry('lucia', key, date)
              const isToday = date === today
              const isWeekend = i >= 5

              // For specials: show rotation text if entry has day_number but no content
              let specialsPlaceholder = null
              if (key === 'specials' && entry?.day_number && !entry?.content) {
                specialsPlaceholder = SPECIALS_ROTATION[entry.day_number] || null
              }

              return (
                <EntryCell
                  key={date}
                  entry={specialsPlaceholder ? { ...entry, content: specialsPlaceholder, _isPlaceholder: true } : entry}
                  date={date}
                  isToday={isToday}
                  isWeekend={isWeekend}
                  onTap={() => onCellTap({ person: 'lucia', category: key, date, entry })}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
