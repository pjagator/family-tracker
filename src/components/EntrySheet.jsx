import { useState, useEffect, useRef } from 'react'
import { useToast } from './ToastContext'
import { useSwipeDismiss } from '../hooks/useSwipeDismiss'

const CATEGORY_LABELS = {
  math: 'Math', science: 'Science', ela: 'ELA', ss: 'Social Studies',
  spanish: 'Spanish', religion: 'Religion', activities: 'Activities',
  homework: 'Homework', specials: 'Specials', notes: 'Notes',
  work: 'Work', events: 'Events', schedule: 'Schedule',
}

const SCHOOL_CATEGORIES = new Set([
  'math', 'science', 'ela', 'ss', 'spanish', 'religion', 'homework', 'specials',
])

export default function EntrySheet({ cell, onSave, onDelete, onClose }) {
  const showToast = useToast()
  const [content, setContent] = useState('')
  const [isTest, setIsTest] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const handleSaveRef = useRef(null)
  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDismiss({
    onDismiss: () => handleSaveRef.current?.(),
  })

  useEffect(() => {
    if (cell) {
      setContent(cell.entry?.content || '')
      setIsTest(cell.entry?.is_test || false)
      setIsComplete(cell.entry?.is_complete || false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [cell])

  if (!cell) return null

  const dateObj = new Date(cell.date + 'T00:00:00')
  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const personLabel = cell.person.charAt(0).toUpperCase() + cell.person.slice(1)
  const categoryLabel = CATEGORY_LABELS[cell.category] || cell.category

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      id: cell.entry?.id || null,
      person: cell.person,
      category: cell.category,
      date: cell.date,
      content: content.trim(),
      is_test: isTest,
      is_complete: isComplete,
    })
    setSaving(false)
    showToast({ message: 'Entry saved', type: 'success' })
    onClose()
  }
  handleSaveRef.current = handleSave

  const handleDelete = async () => {
    if (!cell.entry?.id) { onClose(); return }
    if (!confirm('Delete this entry?')) return
    setSaving(true)
    await onDelete(cell.entry.id)
    setSaving(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={handleSave} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slideUp max-h-[80vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {/* Header */}
          <div className="mb-3">
            <div className="text-base font-semibold text-navy">{personLabel} &middot; {categoryLabel}</div>
            <div className="text-xs text-slate">{dateLabel}</div>
          </div>

          {/* Dimmed cell hint */}
          {cell.dimmed && !cell.entry?.content && (
            <div className="text-xs text-gray-400 italic mb-2">This subject doesn't normally meet on this day</div>
          )}

          {/* Content input */}
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy resize-none"
          />

          {/* Toggles — only for school subject rows */}
          {SCHOOL_CATEGORIES.has(cell.category) && (
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isTest}
                  onChange={(e) => setIsTest(e.target.checked)}
                  className="rounded border-gray-300 text-test focus:ring-test"
                />
                <span className={isTest ? 'text-test font-medium' : 'text-gray-600'}>Test / Quiz</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isComplete}
                  onChange={(e) => setIsComplete(e.target.checked)}
                  className="rounded border-gray-300 text-complete focus:ring-complete"
                />
                <span className={isComplete ? 'text-complete font-medium' : 'text-gray-600'}>Complete</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {cell.entry?.id && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-3 border border-red-200 text-test rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
