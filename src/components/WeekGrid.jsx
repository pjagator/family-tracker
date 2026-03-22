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
}

// Beau: which subjects meet on odd vs even days
const BEAU_ODD_DAYS = new Set(['math', 'religion'])   // days 1,3,5,7
const BEAU_EVEN_DAYS = new Set(['science', 'ss', 'spanish']) // days 2,4,6,8
const BEAU_ALL_DAYS = new Set(['ela', 'activities'])   // always show

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

function isOddDay(dn) { return dn === 1 || dn === 3 || dn === 5 || dn === 7 }
function isEvenDay(dn) { return dn === 2 || dn === 4 || dn === 6 || dn === 8 }

function beauRowMeetsOnDay(catKey, dayNum) {
  if (!dayNum) return true
  if (BEAU_ALL_DAYS.has(catKey)) return true
  if (BEAU_ODD_DAYS.has(catKey)) return isOddDay(dayNum)
  if (BEAU_EVEN_DAYS.has(catKey)) return isEvenDay(dayNum)
  return true
}

export default function WeekGrid({ weekDates, dayNumbers, noSchoolDays, onDayNumberChange, onToggleNoSchool, onCellTap, getEntry }) {
  const today = new Date().toISOString().split('T')[0]
  const noSchoolSet = new Set(noSchoolDays || [])

  const [openSections, setOpenSections] = useState(() => {
    const init = {}
    PEOPLE.forEach(p => { init[p.key] = p.defaultOpen })
    return init
  })

  const [pickerDate, setPickerDate] = useState(null)

  const toggleSection = (personKey) => {
    setOpenSections(prev => ({ ...prev, [personKey]: !prev[personKey] }))
  }

  const getLuciaSpecials = (date) => {
    if (noSchoolSet.has(date)) return null
    const dn = dayNumbers[date]
    if (!dn) return null
    return SPECIALS_ROTATION[dn] || null
  }

  const getDisplayEntry = (person, category, date) => {
    const entry = getEntry(person, category, date)
    if (person === 'lucia' && category === 'specials') {
      const autoText = getLuciaSpecials(date)
      if (autoText && !entry?.content) {
        return { ...(entry || {}), content: autoText, _isPlaceholder: true }
      }
    }
    return entry
  }

  const handlePickerSelect = (num) => {
    if (pickerDate) {
      onDayNumberChange(pickerDate, num)
      setPickerDate(null)
    }
  }

  const handleToggleNoSchool = () => {
    if (pickerDate) {
      onToggleNoSchool(pickerDate)
      setPickerDate(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">

        {/* Shared sticky date header */}
        <div className="grid sticky top-0 z-20" style={{ gridTemplateColumns: GRID_COLS }}>
          <div className="bg-gray-100 border border-[#e2e8f0] p-1.5 sticky left-0 z-20 text-[10px] text-slate text-center">
            Day #
          </div>
          {weekDates.map((date, i) => {
            const d = new Date(date + 'T00:00:00')
            const isToday = date === today
            const isWeekend = i >= 5
            const dn = dayNumbers[date]
            const isNoSchool = noSchoolSet.has(date)
            return (
              <div
                key={date}
                className={`border border-l-0 border-[#e2e8f0] p-1 text-center text-[11px] font-semibold relative ${
                  isNoSchool ? 'bg-red-50 text-red-400'
                  : isToday ? 'bg-today text-navy'
                  : isWeekend ? 'bg-weekend text-slate'
                  : 'bg-gray-100 text-slate'
                }`}
              >
                <div>{DAY_ABBRS[i]}</div>
                <div className="text-[10px]">{d.getMonth() + 1}/{d.getDate()}</div>
                {!isWeekend && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPickerDate(pickerDate === date ? null : date) }}
                    className={`mt-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 transition ${
                      isNoSchool ? 'bg-red-200 text-red-600'
                      : dn ? 'bg-navy text-white'
                      : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isNoSchool ? 'OFF' : dn ? `D${dn}` : '--'}
                  </button>
                )}

                {/* Day number picker dropdown */}
                {pickerDate === date && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-1.5 w-[130px]">
                    <div className="grid grid-cols-4 gap-0.5">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <button
                          key={n}
                          onClick={() => handlePickerSelect(n)}
                          className={`text-[12px] font-semibold py-1.5 rounded transition ${
                            !isNoSchool && dayNumbers[date] === n
                              ? 'bg-navy text-white'
                              : 'bg-gray-50 text-gray-700 active:bg-gray-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleToggleNoSchool}
                      className={`w-full text-[11px] font-medium py-1.5 mt-1 rounded transition ${
                        isNoSchool
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-50 text-gray-500 active:bg-gray-200'
                      }`}
                    >
                      {isNoSchool ? 'Remove No School' : 'No School'}
                    </button>
                    {dn && !isNoSchool && (
                      <button
                        onClick={() => handlePickerSelect(null)}
                        className="w-full text-[11px] text-slate py-1 mt-0.5 active:bg-gray-100 rounded"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Click outside to close picker */}
        {pickerDate && (
          <div className="fixed inset-0 z-10" onClick={() => setPickerDate(null)} />
        )}

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
                {person.rows.map(({ key: cat, label }) => {
                  const beauHasDayNumbers = person.key === 'beau' &&
                    weekDates.slice(0, 5).some(d => dayNumbers[d])

                  if (person.key === 'beau' && beauHasDayNumbers && !BEAU_ALL_DAYS.has(cat)) {
                    const meetsAnyDay = weekDates.slice(0, 5).some(d =>
                      !noSchoolSet.has(d) && beauRowMeetsOnDay(cat, dayNumbers[d])
                    )
                    if (!meetsAnyDay) return null
                  }

                  return (
                    <div key={cat} className="contents">
                      <div className="bg-gray-50 border border-t-0 border-[#e2e8f0] p-1.5 text-[12px] font-medium text-gray-600 sticky left-0 z-10 flex items-center">
                        {label}
                      </div>
                      {weekDates.map((date, i) => {
                        const entry = getDisplayEntry(person.key, cat, date)
                        const rawEntry = getEntry(person.key, cat, date)
                        const isToday = date === today
                        const isWeekend = i >= 5
                        const dn = dayNumbers[date]
                        const isNoSchool = noSchoolSet.has(date)

                        // Dim Beau cells on days the subject doesn't meet or no school
                        const dimmed = (person.key === 'beau' && dn && !beauRowMeetsOnDay(cat, dn)) ||
                          (person.key === 'beau' && isNoSchool && !BEAU_ALL_DAYS.has(cat)) ||
                          (person.key === 'lucia' && isNoSchool && cat !== 'activities')

                        return (
                          <EntryCell
                            key={date}
                            entry={entry}
                            date={date}
                            isToday={isToday}
                            isWeekend={isWeekend}
                            dimmed={dimmed}
                            onTap={() => onCellTap({ person: person.key, category: cat, date, entry: rawEntry })}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
