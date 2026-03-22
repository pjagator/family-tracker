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

const BEAU_ODD_DAYS = new Set(['math', 'religion'])
const BEAU_EVEN_DAYS = new Set(['science', 'ss', 'spanish'])
const BEAU_ALL_DAYS = new Set(['ela', 'activities'])

// Children who can have per-person no-school
const CHILDREN = ['beau', 'lucia', 'niva']

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

export default function WeekGrid({
  weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  onCellTap, onAllieToggle, getEntry,
}) {
  const today = new Date().toISOString().split('T')[0]
  const globalSet = new Set(globalNoSchool || [])

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

  const handleGlobalNoSchool = () => {
    if (pickerDate) {
      onToggleGlobalNoSchool(pickerDate)
      setPickerDate(null)
    }
  }

  // Allie work toggle: cycle through Teach -> Off -> (clear)
  const handleAllieWorkToggle = (date) => {
    const entry = getEntry('allie', 'work', date)
    const current = entry?.content || ''
    let next
    if (current === 'Teach') next = 'Off'
    else if (current === 'Off') next = ''
    else next = 'Teach'
    onAllieToggle({ id: entry?.id || null, person: 'allie', category: 'work', date, content: next })
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
            const isGlobalOff = globalSet.has(date)
            return (
              <div
                key={date}
                className={`border border-l-0 border-[#e2e8f0] p-1 text-center text-[11px] font-semibold relative ${
                  isGlobalOff ? 'bg-gray-200 text-gray-400'
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

        {/* Click outside to close picker */}
        {pickerDate && (
          <div className="fixed inset-0 z-10" onClick={() => setPickerDate(null)} />
        )}

        {/* Person sections */}
        {PEOPLE.map((person, personIdx) => {
          const isChild = CHILDREN.includes(person.key)

          return (
            <div key={person.key} style={{ marginTop: personIdx > 0 ? '12px' : '0' }}>

              {/* Person header bar */}
              <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>
                {/* Name + collapse toggle in first column */}
                <button
                  onClick={() => toggleSection(person.key)}
                  className="flex items-center gap-1.5 px-2 py-2 text-white sticky left-0 z-10"
                  style={{ backgroundColor: person.headerBg }}
                >
                  <span className="text-[13px] font-bold">{person.label}</span>
                  <span className={`text-[10px] text-white/60 transition-transform ${openSections[person.key] ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {/* Per-person "Out" toggles for each day (children only) */}
                {weekDates.map((date, i) => {
                  const isWeekend = i >= 5
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

              {/* Category rows */}
              {openSections[person.key] && (
                <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>
                  {person.rows.map(({ key: cat, label }) => {
                    // Allie work row: special tap-to-toggle
                    if (person.key === 'allie' && cat === 'work') {
                      return (
                        <div key={cat} className="contents">
                          <div className="bg-gray-50 border border-t-0 border-[#e2e8f0] p-1.5 text-[12px] font-medium text-gray-600 sticky left-0 z-10 flex items-center">
                            {label}
                          </div>
                          {weekDates.map((date, i) => {
                            const entry = getEntry('allie', 'work', date)
                            const val = entry?.content || ''
                            const isToday = date === today
                            const isWeekend = i >= 5
                            const bg = isToday ? 'bg-today' : isWeekend ? 'bg-weekend' : 'bg-white'
                            return (
                              <button
                                key={date}
                                onClick={() => handleAllieWorkToggle(date)}
                                className={`${bg} border border-t-0 border-l-0 border-[#e2e8f0] p-1.5 text-center min-h-[44px] w-full active:bg-indigo-50 transition`}
                              >
                                <span className={`text-[12px] font-medium ${
                                  val === 'Teach' ? 'text-navy' : val === 'Off' ? 'text-gray-400' : 'text-gray-200'
                                }`}>
                                  {val || '--'}
                                </span>
                              </button>
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
                        <div className="bg-gray-50 border border-t-0 border-[#e2e8f0] p-1.5 text-[12px] font-medium text-gray-600 sticky left-0 z-10 flex items-center">
                          {label}
                        </div>
                        {weekDates.map((date, i) => {
                          const entry = getDisplayEntry(person.key, cat, date)
                          const rawEntry = getEntry(person.key, cat, date)
                          const isToday = date === today
                          const isWeekend = i >= 5
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
                                onTap={() => onCellTap({ person: person.key, category: cat, date, entry: rawEntry })}
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
          )
        })}
      </div>
    </div>
  )
}
