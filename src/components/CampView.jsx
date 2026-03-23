import { useState } from 'react'
import { useToast } from './ToastContext'

const CHILDREN = ['beau', 'lucia', 'niva']

export default function CampView({ camps, onUpsert, onRemove }) {
  const showToast = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [weekName, setWeekName] = useState('')
  const [dates, setDates] = useState('')
  const [editing, setEditing] = useState(null) // camp id being edited
  const [deleting, setDeleting] = useState(false)

  // Group camps by week_name + dates
  const weeks = []
  const weekMap = {}
  camps.forEach((c) => {
    const key = `${c.week_name}|${c.dates}`
    if (!weekMap[key]) {
      weekMap[key] = { week_name: c.week_name, dates: c.dates, camps: {} }
      weeks.push(weekMap[key])
    }
    weekMap[key].camps[c.person] = c
  })

  const handleAddWeek = async () => {
    if (!weekName.trim()) return
    // Create one camp entry per child for this week
    for (const person of CHILDREN) {
      await onUpsert({ week_name: weekName.trim(), dates: dates.trim(), person, camp_name: '', is_registered: false, notes: '' })
    }
    setWeekName('')
    setDates('')
    setShowAdd(false)
    showToast({ message: 'Camp week added', type: 'success' })
  }

  const handleCampNameSave = async (camp, newName) => {
    await onUpsert({ ...camp, camp_name: newName })
    setEditing(null)
  }

  const handleToggleRegistered = (camp) => {
    onUpsert({ ...camp, is_registered: !camp.is_registered })
  }

  const handleDeleteWeek = async (weekData) => {
    if (!confirm(`Delete "${weekData.week_name}" and all camp entries?`)) return
    setDeleting(true)
    for (const person of CHILDREN) {
      if (weekData.camps[person]) {
        await onRemove(weekData.camps[person].id)
      }
    }
    setDeleting(false)
  }

  return (
    <div className="pb-24">
      <div className="bg-navy text-white px-4 py-3 flex items-center justify-between">
        <h2 className="text-base font-bold">Summer Camps</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs bg-white/20 text-white px-3 py-1 rounded active:bg-white/30 transition"
        >
          {showAdd ? 'Cancel' : '+ Add week'}
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-2">
          <input
            type="text"
            value={weekName}
            onChange={(e) => setWeekName(e.target.value)}
            placeholder="Week name (e.g. Week 1)"
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
            autoFocus
          />
          <input
            type="text"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            placeholder="Dates (e.g. Jun 2-6)"
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={handleAddWeek}
            className="w-full py-2 bg-navy text-white rounded text-sm font-medium active:scale-[0.98] transition"
          >
            Add week
          </button>
        </div>
      )}

      {weeks.length === 0 && !showAdd && (
        <div className="p-8 text-center text-gray-400 text-sm">
          No camps planned yet. Tap "+ Add week" to get started.
        </div>
      )}

      <div className="p-4 space-y-4">
        {weeks.map((w, wi) => (
          <div key={wi} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Week header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div>
                <div className="text-sm font-semibold text-navy">{w.week_name}</div>
                {w.dates && <div className="text-[11px] text-slate">{w.dates}</div>}
              </div>
              <button
                onClick={() => handleDeleteWeek(w)}
                disabled={deleting}
                className="text-gray-400 text-xs px-2 py-1 active:text-red-500 disabled:opacity-50 transition"
              >
                Delete
              </button>
            </div>

            {/* Child rows */}
            {CHILDREN.map((person) => {
              const camp = w.camps[person]
              if (!camp) return null
              const isEditing = editing === camp.id
              return (
                <div key={person} className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-[12px] font-medium text-slate w-14 shrink-0">
                    {person.charAt(0).toUpperCase() + person.slice(1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={camp.camp_name}
                        onBlur={(e) => handleCampNameSave(camp, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditing(camp.id)}
                        className="text-sm text-gray-700 text-left w-full truncate active:text-navy transition"
                      >
                        {camp.camp_name || <span className="text-gray-400">Tap to add camp</span>}
                      </button>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={camp.is_registered}
                      onChange={() => handleToggleRegistered(camp)}
                      className="rounded border-gray-300 text-navy focus:ring-navy"
                    />
                    <span className={`text-[11px] ${camp.is_registered ? 'text-complete font-medium' : 'text-gray-400'}`}>
                      Reg
                    </span>
                  </label>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
