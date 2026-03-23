import { useState } from 'react'
import { useToast } from './ToastContext'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PERSON_CATEGORIES = {
  beau: ['activities'],
  lucia: ['activities'],
  niva: ['activities', 'notes'],
  allie: ['events'],
  patrick: ['schedule', 'notes'],
}

export default function RecurringManager({ items, onAdd, onRemove }) {
  const showToast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [person, setPerson] = useState('beau')
  const [category, setCategory] = useState('activities')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePersonChange = (p) => {
    setPerson(p)
    setCategory(PERSON_CATEGORIES[p][0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    await onAdd({ person, category, day_of_week: dayOfWeek, content: content.trim() })
    setContent('')
    setSaving(false)
    setShowForm(false)
    showToast({ message: 'Recurring item added', type: 'success' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this recurring item?')) return
    await onRemove(id)
  }

  // Group items by person
  const grouped = {}
  items.forEach((item) => {
    if (!grouped[item.person]) grouped[item.person] = []
    grouped[item.person].push(item)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy">Recurring Activities</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-navy font-medium px-2 py-1 bg-gray-100 rounded active:bg-gray-200 transition"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            <select
              value={person}
              onChange={(e) => handlePersonChange(e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-200 rounded text-sm"
            >
              {Object.keys(PERSON_CATEGORIES).map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-200 rounded text-sm"
            >
              {PERSON_CATEGORIES[person].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="px-2 py-2 border border-gray-200 rounded text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>{DAY_NAMES[d]}</option>
              ))}
            </select>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Piano lesson"
              className="flex-1 px-2 py-2 border border-gray-200 rounded text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-navy text-white rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add recurring item'}
          </button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <p className="text-xs text-gray-400">No recurring items yet. These auto-fill when new weeks are created.</p>
      )}

      {Object.entries(grouped).map(([personKey, personItems]) => (
        <div key={personKey} className="mb-2">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider mb-1">
            {personKey.charAt(0).toUpperCase() + personKey.slice(1)}
          </div>
          {personItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 px-2 bg-white rounded mb-1 border border-gray-100">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{DAY_NAMES[item.day_of_week]}</span>
                <span className="text-gray-400 mx-1">&middot;</span>
                <span>{item.content}</span>
                <span className="text-gray-400 text-xs ml-1">({item.category})</span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-gray-400 text-xs px-1 active:text-red-500 transition"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
