import { useState } from 'react'
import EntryCell from './EntryCell'

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SPECIALS_ROTATION = {
  1: 'Music/PE',
  2: 'Spanish, Science',
  3: 'Music/PE',
  4: 'Spanish',
  5: 'Library Research',
  6: 'Art & PE',
  7: '(varies)',
  8: '(varies)',
}

const PEOPLE = [
  {
    key: 'beau',
    label: 'Beau',
    headerBg: '#1a2744',
    rows: [
      { key: 'math', label: 'Math' },
      { key: 'science', label: 'Science' },
      { key: 'ela', label: 'ELA' },
      { key: 'ss', label: 'Social St.' },
      { key: 'spanish', label: 'Spanish' },
      { key: 'religion', label: 'Religion' },
      { key: 'activities', label: 'Activities' },
    ],
    defaultOpen: true,
  },
  {
    key: 'lucia',
    label: 'Lucia',
    headerBg: '#5b3a6b',
    rows: [
      { key: 'homework', label: 'Homework' },
      { key: 'specials', label: 'Specials' },
      { key: 'activities', label: 'Activities' },
    ],
    defaultOpen: true,
  },
  {
    key: 'niva',
    label: 'Niva',
    headerBg: '#1a5c5c',
    rows: [
      { key: 'activities', label: 'Activities' },
      { key: 'notes', label: 'Notes' },
    ],
    defaultOpen: false,
  },
  {
    key: 'allie',
    label: 'Allie',
    headerBg: '#6b6b6b',
    rows: [
      { key: 'work', label: 'Work' },
      { key: 'events', label: 'Events' },
    ],
    defaultOpen: false,
  },
  {
    key: 'patrick',
    label: 'Patrick',
    headerBg: '#475569',
    rows: [
      { key: 'schedule', label: 'Schedule' },
      { key: 'notes', label: 'Notes' },
    ],
    defaultOpen: false,
  },
]

const GRID_COLS = '90px repeat(7, 1fr)'

export default function WeekGrid({ weekDates, onCellTap, getEntry }) {
  const today = new Date().toISOString().split('T')[0]

  const [openSections, setOpenSections] = useState(() => {
    const init = {}
    PEOPLE.forEach(p => { init[p.key] = p.defaultOpen })
    return init
  })

  const toggleSection = (personKey) => {
    setOpenSections(prev => ({ ...prev, [personKey]: !prev[personKey] }))
  }

  const getDisplayEntry = (person, category, date) => {
    const entry = getEntry(person, category, date)
    if (person === 'lucia' && category === 'specials' && entry?.day_number && !entry?.content) {
      const placeholder = SPECIALS_ROTATION[entry.day_number]
      if (placeholder) return { ...entry, content: placeholder, _isPlaceholder: true }
    }
    return entry
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">

        {/* Shared sticky date header */}
        <div className="grid sticky top-0 z-20" style={{ gridTemplateColumns: GRID_COLS }}>
          <div className="bg-gray-100 border border-[#e2e8f0] p-1.5 sticky left-0 z-20" />
          {weekDates.map((date, i) => {
            const d = new Date(date + 'T00:00:00')
            const isToday = date === today
            const isWeekend = i >= 5
            return (
              <div
                key={date}
                className={`border border-l-0 border-[#e2e8f0] p-1.5 text-center text-[11px] font-semibold ${
                  isToday ? 'bg-today text-navy' : isWeekend ? 'bg-weekend text-slate' : 'bg-gray-100 text-slate'
                }`}
              >
                <div>{DAY_ABBRS[i]}</div>
                <div>{d.getMonth() + 1}/{d.getDate()}</div>
              </div>
            )
          })}
        </div>

        {/* Person sections */}
        {PEOPLE.map((person, personIdx) => (
          <div key={person.key} style={{ marginTop: personIdx > 0 ? '12px' : '0' }}>

            {/* Person header bar */}
            <button
              onClick={() => toggleSection(person.key)}
              className="w-full flex items-center gap-2 px-3 py-2.5 active:opacity-80 transition"
              style={{ backgroundColor: person.headerBg }}
            >
              <span className="text-[13px] font-bold text-white">{person.label}</span>
              <span className={`text-[10px] text-white/60 transition-transform ${openSections[person.key] ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Category rows */}
            {openSections[person.key] && (
              <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>
                {person.rows.map(({ key: cat, label }) => (
                  <div key={cat} className="contents">
                    <div className="bg-gray-50 border border-t-0 border-[#e2e8f0] p-1.5 text-[12px] font-medium text-gray-600 sticky left-0 z-10 flex items-center">
                      {label}
                    </div>
                    {weekDates.map((date, i) => {
                      const entry = getDisplayEntry(person.key, cat, date)
                      const rawEntry = getEntry(person.key, cat, date)
                      const isToday = date === today
                      const isWeekend = i >= 5
                      return (
                        <EntryCell
                          key={date}
                          entry={entry}
                          date={date}
                          isToday={isToday}
                          isWeekend={isWeekend}
                          onTap={() => onCellTap({ person: person.key, category: cat, date, entry: rawEntry })}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
