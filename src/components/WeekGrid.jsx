import { useState } from 'react'
import EntryCell from './EntryCell'
import WeatherRow from './WeatherRow'
import WeekNav from './WeekNav'

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SPECIALS_ROTATION = {
  1: 'Music/PE',
  2: 'Spanish, Science',
  3: 'Music/PE',
  4: 'Spanish',
  5: 'Library Research',
  6: 'Art & PE',
}

const BEAU_ODD_DAYS = new Set(['math', 'religion'])
const BEAU_EVEN_DAYS = new Set(['science', 'ss', 'spanish'])
const BEAU_ALL_DAYS = new Set(['ela', 'activities'])

// Children who can have per-person no-school
const CHILDREN = ['beau', 'lucia', 'niva']

const PEOPLE = [
  {
    key: 'beau',
    label: 'Beau',
    emoji: '📘',
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
    emoji: '🎨',
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
    emoji: '🧸',
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
    emoji: '💼',
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
    emoji: '📋',
    headerBg: '#475569',
    rows: [
      { key: 'schedule', label: 'Schedule' },
      { key: 'notes', label: 'Notes' },
    ],
    defaultOpen: false,
  },
]

function isOddDay(dn) { return dn === 1 || dn === 3 || dn === 5 || dn === 7 }
function isEvenDay(dn) { return dn === 2 || dn === 4 || dn === 6 || dn === 8 }

function beauRowMeetsOnDay(catKey, dayNum) {
  if (!dayNum) return true
  if (BEAU_ALL_DAYS.has(catKey)) return true
  if (BEAU_ODD_DAYS.has(catKey)) return isOddDay(dayNum)
  if (BEAU_EVEN_DAYS.has(catKey)) return isEvenDay(dayNum)
  return true
}

function isWeekendDate(date) {
  const day = new Date(date + 'T00:00:00').getDay()
  return day === 0 || day === 6
}

export default function WeekGrid({
  weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  onCellTap, onAllieToggle, getEntry,
  onPrev, onNext, onToday,
  // Mobile props
  isMobile, visibleDates: visDates, startIdx,
}) {
  const today = new Date().toISOString().split('T')[0]
  const globalSet = new Set(globalNoSchool || [])

  // Use visible dates on mobile, full week on desktop
  const visibleDates = visDates || weekDates
  const gridCols = isMobile
    ? `72px repeat(${visibleDates.length}, 1fr)`
    : '90px repeat(7, 1fr)'

  const [openSections, setOpenSections] = useState(() => {
    const init = {}
    PEOPLE.forEach(p => { init[p.key] = p.defaultOpen })
    return init
  })

  const [pickerDate, setPickerDate] = useState(null)

  const toggleSection = (personKey) => {
    setOpenSections(prev => ({ ...prev, [personKey]: !prev[personKey] }))
  }

  const isPersonOff = (person, date) => {
    if (globalSet.has(date) && CHILDREN.includes(person)) return true
    return (personNoSchool?.[person] || []).includes(date)
  }

  const getLuciaSpecials = (date) => {
    if (isPersonOff('lucia', date)) return null
    const dn = dayNumbers[date]
    if (!dn) return null
    return SPECIALS_ROTATION[dn] || null
  }

  const getDisplayEntry = (person, category, date) => {
    const entry = getEntry(person, category, date)
    if (person === 'lucia' && category === 'specials') {
      const autoText = getLuciaSpecials(date)
      if (autoText && !entry?.content) {
        return { ...(entry || {}), content: autoText, _isAutoSpecial: true }
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

  const handleGlobalNoSchool = () => {
    if (pickerDate) {
      onToggleGlobalNoSchool(pickerDate)
      setPickerDate(null)
    }
  }

  // Get collapsed summary text for a person
  const getCollapsedSummary = (person) => {
    const entries = []
    for (const date of weekDates) {
      for (const row of person.rows) {
        const e = getEntry(person.key, row.key, date)
        if (e?.content) {
          const d = new Date(date + 'T00:00:00')
          const dayAbbr = DAY_ABBRS[d.getDay() === 0 ? 6 : d.getDay() - 1]
          entries.push(`${dayAbbr}: ${e.content.length > 15 ? e.content.slice(0, 15) + '…' : e.content}`)
        }
      }
    }
    if (!entries.length) return 'No entries this week'
    return entries.slice(0, 3).join('  •  ') + (entries.length > 3 ? `  (+${entries.length - 3} more)` : '')
  }

  // Count entries for a person this week
  const getEntryCount = (person) => {
    let count = 0
    for (const date of weekDates) {
      for (const row of person.rows) {
        if (getEntry(person.key, row.key, date)?.content) count++
      }
    }
    return count
  }

  return (
    <div>
      <div className={isMobile ? '' : 'min-w-[600px]'}>

        {/* Sticky header: week nav + date row + weather */}
        <div className="sticky top-0 z-20 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <WeekNav weekDates={weekDates} onPrev={onPrev} onNext={onNext} onToday={onToday} />

        {/* Mobile day indicator dots */}
        {isMobile && (
          <div className="flex justify-center gap-1.5 py-1.5 bg-navy">
            {weekDates.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i >= startIdx && i < startIdx + visibleDates.length ? 'bg-white' : 'bg-white/30'
              }`} />
            ))}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: gridCols }}>
          <div className="bg-gray-100 border border-slate-300 p-1.5 sticky left-0 z-20 text-[10px] text-slate text-center">
            Day #
          </div>
          {visibleDates.map((date) => {
            const d = new Date(date + 'T00:00:00')
            const isToday = date === today
            const isWeekend = isWeekendDate(date)
            const dn = dayNumbers[date]
            const isGlobalOff = globalSet.has(date)
            return (
              <div
                key={date}
                className={`border border-slate-300 p-1 text-center text-[11px] font-semibold relative ${
                  isGlobalOff ? 'bg-gray-200 text-gray-400'
                  : isToday ? 'bg-today text-navy'
                  : isWeekend ? 'bg-weekend text-slate'
                  : 'bg-gray-100 text-slate'
                }`}
              >
                <div>{DAY_ABBRS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
                <div className="text-[10px]">{d.getMonth() + 1}/{d.getDate()}</div>
                {!isWeekend && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPickerDate(pickerDate === date ? null : date) }}
                    className={`mt-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 transition ${
                      isGlobalOff ? 'bg-gray-400 text-white'
                      : dn ? 'bg-navy text-white'
                      : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isGlobalOff ? 'OFF' : dn ? `D${dn}` : '--'}
                  </button>
                )}
                {isGlobalOff && !isWeekend && (
                  <div className="text-[8px] text-gray-400 mt-0.5">No School</div>
                )}

                {/* Day number picker */}
                {pickerDate === date && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-1.5 w-[130px]">
                    <div className="grid grid-cols-4 gap-0.5">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <button
                          key={n}
                          onClick={() => handlePickerSelect(n)}
                          className={`text-[12px] font-semibold py-1.5 rounded transition ${
                            !isGlobalOff && dayNumbers[date] === n
                              ? 'bg-navy text-white'
                              : 'bg-gray-50 text-gray-700 active:bg-gray-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleGlobalNoSchool}
                      className={`w-full text-[11px] font-medium py-1.5 mt-1 rounded transition ${
                        isGlobalOff
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-red-50 text-red-500 active:bg-red-100'
                      }`}
                    >
                      {isGlobalOff ? 'Remove No School' : 'No School (all)'}
                    </button>
                    {dn && !isGlobalOff && (
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

        {/* Weather row */}
        <WeatherRow weekDates={visibleDates} gridCols={gridCols} />
        </div>{/* end sticky header */}

        {/* Click outside to close picker */}
        {pickerDate && (
          <div className="fixed inset-0 z-10" onClick={() => setPickerDate(null)} />
        )}

        {/* Person sections */}
        {PEOPLE.map((person, personIdx) => {
          const isChild = CHILDREN.includes(person.key)
          const entryCount = getEntryCount(person)

          return (
            <div key={person.key} style={{ marginTop: personIdx > 0 ? '12px' : '0' }}>

              {/* Person header bar */}
              <div className="grid" style={{ gridTemplateColumns: gridCols }}>
                {/* Name + collapse toggle in first column */}
                <button
                  onClick={() => toggleSection(person.key)}
                  className="flex items-center gap-1.5 px-2 py-2 text-white sticky left-0 z-10"
                  style={{ backgroundColor: person.headerBg }}
                >
                  <span className="text-[14px]">{person.emoji}</span>
                  <span className="text-[13px] font-bold">{person.label}</span>
                  {entryCount > 0 && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full ml-0.5">
                      {entryCount}
                    </span>
                  )}
                  <span className={`text-[10px] text-white/60 transition-transform duration-200 ml-auto ${openSections[person.key] ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {/* Per-person "Out" toggles for each day (children only) */}
                {visibleDates.map((date) => {
                  const isWeekend = isWeekendDate(date)
                  const isGlobalOff = globalSet.has(date)
                  const isPersonalOff = (personNoSchool?.[person.key] || []).includes(date)
                  const showOff = isChild && !isWeekend

                  return (
                    <div
                      key={date}
                      className="flex items-center justify-center py-1"
                      style={{ backgroundColor: person.headerBg }}
                    >
                      {showOff && (
                        isGlobalOff ? (
                          <span className="text-[9px] text-white/40">Off</span>
                        ) : (
                          <button
                            onClick={() => onTogglePersonNoSchool(person.key, date)}
                            className={`text-[9px] font-medium px-2 py-0.5 rounded transition ${
                              isPersonalOff
                                ? 'bg-white/30 text-white'
                                : 'text-white/30 active:text-white/60'
                            }`}
                          >
                            {isPersonalOff ? 'Out' : ''}
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Collapsed summary */}
              {!openSections[person.key] && (
                <div
                  className="px-3 py-1.5 text-[11px] text-gray-500 bg-gray-50/80 border-b border-slate-300 truncate"
                  style={{ borderLeft: `3px solid ${person.headerBg}` }}
                >
                  {getCollapsedSummary(person)}
                </div>
              )}

              {/* Category rows */}
              {openSections[person.key] && (
                <div className="animate-expandDown overflow-hidden">
                <div className="grid" style={{ gridTemplateColumns: gridCols }}>
                  {person.rows.map(({ key: cat, label }, rowIdx) => {
                    // Alternating row bg
                    const rowBgClass = rowIdx % 2 === 1 ? 'bg-gray-50/40' : ''

                    // Allie work row: visible toggle chips
                    if (person.key === 'allie' && cat === 'work') {
                      return (
                        <div key={cat} className="contents">
                          <div
                            className="bg-gray-50 border border-slate-300 p-1.5 text-[13px] font-semibold text-gray-700 sticky left-0 z-10 flex items-center"
                            style={{ borderLeftColor: person.headerBg, borderLeftWidth: '3px' }}
                          >
                            {label}
                          </div>
                          {visibleDates.map((date) => {
                            const entry = getEntry('allie', 'work', date)
                            const val = entry?.content || ''
                            const isToday = date === today
                            const isWeekend = isWeekendDate(date)
                            const bg = isToday ? 'bg-today' : isWeekend ? 'bg-weekend' : rowBgClass || 'bg-white'
                            return (
                              <div
                                key={date}
                                className={`${bg} border border-slate-300 p-1 flex items-center justify-center gap-1 min-h-[44px] ${
                                  isToday ? 'border-l-2 border-l-today-border' : ''
                                }`}
                              >
                                <button
                                  onClick={() => onAllieToggle({ id: entry?.id || null, person: 'allie', category: 'work', date, content: val === 'Teach' ? '' : 'Teach' })}
                                  className={`text-[10px] font-medium px-2 py-1 rounded-full transition min-h-[28px] ${
                                    val === 'Teach' ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400 active:bg-gray-200'
                                  }`}
                                >
                                  Teach
                                </button>
                                <button
                                  onClick={() => onAllieToggle({ id: entry?.id || null, person: 'allie', category: 'work', date, content: val === 'Off' ? '' : 'Off' })}
                                  className={`text-[10px] font-medium px-2 py-1 rounded-full transition min-h-[28px] ${
                                    val === 'Off' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-400 active:bg-gray-200'
                                  }`}
                                >
                                  Off
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }

                    // Beau: hide rows that don't meet on any day
                    const beauHasDayNumbers = person.key === 'beau' &&
                      weekDates.slice(0, 5).some(d => dayNumbers[d] && !globalSet.has(d))
                    if (person.key === 'beau' && beauHasDayNumbers && !BEAU_ALL_DAYS.has(cat)) {
                      const meetsAnyDay = weekDates.slice(0, 5).some(d =>
                        !globalSet.has(d) && !isPersonOff('beau', d) && beauRowMeetsOnDay(cat, dayNumbers[d])
                      )
                      if (!meetsAnyDay) return null
                    }

                    return (
                      <div key={cat} className="contents">
                        <div
                          className="bg-gray-50 border border-slate-300 p-1.5 text-[13px] font-semibold text-gray-700 sticky left-0 z-10 flex items-center"
                          style={{ borderLeftColor: person.headerBg, borderLeftWidth: '3px' }}
                        >
                          {label}
                        </div>
                        {visibleDates.map((date) => {
                          const entry = getDisplayEntry(person.key, cat, date)
                          const rawEntry = getEntry(person.key, cat, date)
                          const isToday = date === today
                          const isWeekend = isWeekendDate(date)
                          const dn = dayNumbers[date]
                          const off = isPersonOff(person.key, date)

                          // Dim: person is out, or Beau subject doesn't meet on this day
                          let dimmed = false
                          if (off) {
                            dimmed = true
                          } else if (person.key === 'beau' && dn && !BEAU_ALL_DAYS.has(cat) && !beauRowMeetsOnDay(cat, dn)) {
                            dimmed = true
                          }

                          // Show "No School" text for children on global off days
                          if (isChild && globalSet.has(date) && !isWeekend && !entry?.content) {
                            const noSchoolEntry = { content: 'No School', _isPlaceholder: true }
                            return (
                              <EntryCell
                                key={date}
                                entry={cat === (person.key === 'beau' ? 'activities' : person.rows[0].key) ? noSchoolEntry : null}
                                date={date}
                                isToday={isToday}
                                isWeekend={isWeekend}
                                dimmed={cat !== (person.key === 'beau' ? 'activities' : person.rows[0].key)}
                                rowBgClass={rowBgClass}
                                onTap={() => onCellTap({ person: person.key, category: cat, date, entry: rawEntry, dimmed: cat !== (person.key === 'beau' ? 'activities' : person.rows[0].key) })}
                              />
                            )
                          }

                          return (
                            <EntryCell
                              key={date}
                              entry={entry}
                              date={date}
                              isToday={isToday}
                              isWeekend={isWeekend}
                              dimmed={dimmed}
                              rowBgClass={rowBgClass}
                              onTap={() => onCellTap({ person: person.key, category: cat, date, entry: rawEntry, dimmed })}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
