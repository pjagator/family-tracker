import { useState } from 'react'

export default function WordList({ type, words, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const label = type === 'vocab' ? 'Vocab Words' : 'Spelling Words'

  const startEdit = () => {
    setText(words.join(', '))
    setEditing(true)
  }

  const handleSave = async () => {
    const list = text.split(',').map(w => w.trim()).filter(Boolean)
    await onSave(type, list)
    setEditing(false)
  }

  return (
    <div className="px-4 py-2 border-b border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-medium text-gray-600">{label}</span>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-[11px] text-navy font-medium active:text-navy-light"
          >
            {words.length ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter words separated by commas"
            rows={2}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] resize-none focus:outline-none focus:border-navy"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 bg-navy text-white rounded text-[12px] font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-slate text-[12px] border border-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : words.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {words.map((w, i) => (
            <span key={i} className="text-[12px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
              {w}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-gray-300">No words this week</p>
      )}
    </div>
  )
}
