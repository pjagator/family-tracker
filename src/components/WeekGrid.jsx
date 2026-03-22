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
    color: 'border-navy bg-navy/5',
    textColor: 'text-navy',
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
    color: 'border-purple-600 bg-purple-50',
    textColor: 'text-purple-700',
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
    color: 'border-teal-500 bg-teal-50',
    textColor: 'text-teal-700',
    rows: [
      { key: 'activities', label: 'Activities' },
      { key: 'notes', label: 'Notes' },
    ],
    defaultOpen: false,
  },
  {
    key: 'allie',
    label: 'Allie',
    color: 'border-stone-400 bg-stone-50',
    textColor: 'text-stone-600',
    rows: [
      { key: 'work', label: 'Work' },
      { key: 'events', label: 'Events' },
    ],
    defaultOpen: false,
  },
  {
    key: 'patrick',
    label: 'Patrick',
    color: 'border-slate-500 bg-slate-50',
    textColor: 'text-slate-600',
    rows: [
      { key: 'schedule', label: 'Schedule' },
      { key: 'notes', label: 'Notes' },
    ],
    defaultOpen: false,
  },
]

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
    // Lucia specials auto-text
    if (person === 'lucia' && category === 'specials' && entry?.day_number && !entry?.content) {
      const placeholder = SPECIALS_ROTATION[entry.day_number]
      if (placeholder) return { ...entry, content: placeholder, _isPlaceholder: true }
    }
    return entry
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[600px]" style={{ gridTemplateColumns: '90px repeat(7, 1fr)' }}>

        {/* Shared sticky date header */}
        <div className="bg-gray-100 border-r border-b border-gray-300 p-1.5 sticky left-0 z-20" />
        {weekDates.map((date, i) => {
          const d = new Date(date + 'T00:00:00')
          const isToday = date === today
          const isWeekend = i >= 5
          return (
            <div
              key={date}
              className={`border-r border-b border-gray-300 p-1.5 text-center text-[11px] font-semibold sticky top-0 z-20 ${
                isToday ? 'bg-today text-navy' : isWeekend ? 'bg-weekend text-slate' : 'bg-gray-100 text-slate'
              }`}
            >
              <div>{DAY_ABBRS[i]}</div>
              <div>{d.getMonth() + 1}/{d.getDate()}</div>
            </div>
          )
        })}

        {/* Person sections */}
        {PEOPLE.map((person) => (
          <div key={person.key} className="contents">

            {/* Person header row spanning all columns */}
            <button
              onClick={() => toggleSection(person.key)}
              className={`col-span-8 flex items-center gap-2 px-3 py-2 border-l-4 ${person.color} border-b border-gray-200 active:opacity-80 transition sticky left-0 z-10`}
              style={{ gridColumn: '1 / -1' }}
            >
              <span className={`text-[13px] font-bold ${person.textColor}`}>{person.label}</span>
              <span className={`text-[10px] text-slate transition-transform ${openSections[person.key] ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Category rows */}
            {openSections[person.key] && person.rows.map(({ key: cat, label }) => (
              <div key={cat} className="contents">
                <div className={`bg-gray-50 border-r border-b border-gray-200 border-l-4 ${person.color.split(' ')[0]} p-1.5 text-[12px] font-medium text-navy-light sticky left-0 z-10 flex items-center`}>
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
        ))}
      </div>
    </div>
  )
}
