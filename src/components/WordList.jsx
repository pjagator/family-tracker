import { useState } from 'react'
import { useToast } from './ToastContext'

export default function WordList({ type, words, onSave }) {
  const showToast = useToast()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [practiced, setPracticed] = useState(new Set())
  const label = type === 'vocab' ? 'Vocab Words' : 'Spelling Words'

  const startEdit = () => {
    setText(words.join(', '))
    setEditing(true)
  }

  const handleSave = async () => {
    const list = text.split(',').map(w => w.trim()).filter(Boolean)
    await onSave(type, list)
    setEditing(false)
    setPracticed(new Set())
    showToast({ message: 'Words saved', type: 'success' })
  }

  const togglePracticed = (word) => {
    setPracticed(prev => {
      const next = new Set(prev)
      next.has(word) ? next.delete(word) : next.add(word)
      return next
    })
  }

  return (
    <div className="px-4 py-2 border-b border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-xs text-navy font-medium active:text-navy-light transition"
          >
            {words.length ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter words separated by commas"
            rows={2}
            className="w-full px-2 py-2 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:border-navy"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-navy text-white rounded text-xs font-medium active:scale-[0.98] transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-2 text-slate text-xs border border-gray-200 rounded active:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : words.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {words.map((w, i) => (
            <button
              key={i}
              onClick={() => togglePracticed(w)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                practiced.has(w)
                  ? 'bg-purple-200 text-purple-800 ring-1 ring-purple-300'
                  : 'bg-purple-50 text-purple-700 active:bg-purple-100'
              }`}
            >
              {practiced.has(w) && <span className="mr-0.5">✓</span>}
              {w}
            </button>
          ))}
          {practiced.size > 0 && (
            <span className="text-xs text-gray-400 self-center ml-1">
              {practiced.size}/{words.length} practiced
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No words this week</p>
      )}
    </div>
  )
}
