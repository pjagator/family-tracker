import { useState } from 'react'
import { useToast } from './ToastContext'

const PEOPLE = [
  { key: 'beau', label: 'Beau', rows: [] },
  { key: 'lucia', label: 'Lucia', rows: [['homework', 'Homework'], ['activities', 'Activities']] },
  { key: 'niva', label: 'Niva', rows: [['activities', 'Activities'], ['notes', 'Notes']] },
]
const BEAU_ROWS = [['activities', 'Activities'], ['other', 'Other']]

function timeAgo(iso) {
  if (!iso) return 'never'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)} hr ago`
  return `${Math.round(mins / 1440)} days ago`
}

export default function FeedsManager({ feeds, syncing, onAdd, onRemove, onSyncNow }) {
  const showToast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [person, setPerson] = useState('beau')
  const [kind, setKind] = useState('canvas')
  const [category, setCategory] = useState('activities')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const rowsFor = (p) => (p === 'beau' ? BEAU_ROWS : PEOPLE.find(x => x.key === p).rows)
  const personLabel = (p) => PEOPLE.find(x => x.key === p)?.label || p

  const report = (result) => {
    if (result?.error) {
      showToast({ message: result.error.message || 'Sync failed', type: 'error' })
      return
    }
    const failed = (result?.results || []).filter(r => r.error)
    if (failed.length) {
      showToast({ message: `${failed[0].feed}: ${failed[0].error}`, type: 'error' })
    } else {
      const added = (result?.results || []).reduce((n, r) => n + r.added, 0)
      showToast({ message: added ? `Synced. ${added} new item${added === 1 ? '' : 's'}.` : 'Synced. Nothing new.', type: 'success' })
    }
  }

  const handlePerson = (p) => {
    setPerson(p)
    setCategory(p === 'beau' ? 'other' : rowsFor(p)[0][0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const link = url.trim()
    if (!/^(https|webcal):\/\//i.test(link)) {
      showToast({ message: 'Paste the full link, starting with https:// or webcal://', type: 'error' })
      return
    }
    setSaving(true)
    const result = await onAdd({
      person,
      kind,
      label: `${personLabel(person)} ${kind === 'canvas' ? 'Canvas' : 'calendar'}`,
      // Canvas items sort into subject rows by course; anything unmatched, and
      // every item from other calendars, lands in this row.
      default_category: kind === 'canvas' ? (person === 'beau' ? 'other' : rowsFor(person)[0][0]) : category,
      url: link,
    })
    setSaving(false)
    report(result)
    if (!result?.error) {
      setUrl('')
      setShowForm(false)
    }
  }

  const handleRemove = async (feed) => {
    if (!confirm(`Remove "${feed.label}"? Items it added to the tracker will be removed too.`)) return
    const { error } = await onRemove(feed.id)
    if (error) showToast({ message: 'Could not remove the feed', type: 'error' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-navy">Automatic sync</h3>
        {feeds.length > 0 && (
          <button
            onClick={async () => report(await onSyncNow())}
            disabled={syncing}
            className="text-xs font-medium text-navy min-h-[44px] px-2 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>
        )}
      </div>

      {feeds.length === 0 && !showForm && (
        <p className="text-xs text-slate mb-3">
          Paste a calendar link from Canvas or Veracross and assignments and tests fill in on their own, every hour.
        </p>
      )}

      {feeds.map((feed) => {
        const failed = feed.last_status && feed.last_status !== 'ok'
        return (
          <div key={feed.id} className="flex items-center gap-2 py-2 border-b border-gray-200 last:border-b-0">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{feed.label}</div>
              <div className={`text-xs ${failed ? 'text-test' : 'text-slate'} break-words`}>
                {failed ? feed.last_status : `Synced ${timeAgo(feed.last_ok_at)}`}
              </div>
            </div>
            <button
              onClick={() => handleRemove(feed)}
              className="text-xs text-test min-h-[44px] px-2 shrink-0"
            >
              Remove
            </button>
          </div>
        )
      })}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="flex gap-2">
            <select value={person} onChange={(e) => handlePerson(e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-base bg-white min-h-[44px]">
              {PEOPLE.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <select value={kind} onChange={(e) => setKind(e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-base bg-white min-h-[44px]">
              <option value="canvas">Canvas</option>
              <option value="ics">Veracross / other</option>
            </select>
          </div>
          {kind === 'ics' && (
            <label className="block text-xs text-slate">
              Put items in row
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full px-2 py-2 border border-gray-200 rounded-lg text-base bg-white min-h-[44px]">
                {rowsFor(person).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          )}
          <input
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste calendar link"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-navy min-h-[44px]"
          />
          <p className="text-xs text-slate">
            {kind === 'canvas'
              ? 'In Canvas: open Calendar, tap Calendar Feed, copy the link.'
              : 'In Veracross: Calendar, Subscribe to My Calendars, copy the link behind Subscribe.'}
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !url.trim()}
              className="flex-1 min-h-[44px] bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition">
              {saving ? 'Adding...' : 'Add and sync'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="min-h-[44px] px-4 border border-gray-200 rounded-lg text-sm text-slate">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full min-h-[44px] mt-2 border border-dashed border-gray-300 rounded-lg text-sm text-navy font-medium active:bg-gray-100 transition"
        >
          + Add a calendar link
        </button>
      )}
    </div>
  )
}
