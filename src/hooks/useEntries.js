import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import { useResume } from './useResume'

export function useEntries(weekId, familyId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  // True when the last refresh failed and the screen shows a saved copy.
  const [stale, setStale] = useState(false)
  const requestRef = useRef(0)

  const loadEntries = useCallback(async () => {
    if (!weekId || !familyId) return
    const requestId = ++requestRef.current
    setLoading(true)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('week_id', weekId)
      .eq('family_id', familyId)
      .order('sort_order', { ascending: true })

    // A newer request (week change, quick double refresh) supersedes this one.
    if (requestId !== requestRef.current) return

    if (error) {
      console.error('Failed to load entries:', error)
      setStale(true)
    } else {
      setEntries(data || [])
      setStale(false)
      cacheSet(`entries_${weekId}`, data || [])
    }
    setLoading(false)
  }, [weekId, familyId])

  // Show the saved copy for this week right away, then refresh from the server.
  useEffect(() => {
    if (!weekId || !familyId) return
    setEntries(cacheGet(`entries_${weekId}`) || [])
    loadEntries()
  }, [weekId, familyId, loadEntries])

  // Realtime subscription -- listen for changes from other family members
  useEffect(() => {
    if (!weekId || !familyId) return

    const channel = supabase
      .channel(`entries:${weekId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `week_id=eq.${weekId}`,
        },
        () => {
          // Reload all entries on any change
          loadEntries()
        }
      )
      .subscribe((status) => {
        // After a dropped connection is restored, catch up on anything missed.
        if (status === 'SUBSCRIBED') loadEntries()
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [weekId, familyId, loadEntries])

  // Realtime cannot be trusted across a phone sleep: refetch on return.
  useResume(loadEntries)

  const upsertEntry = async (entry) => {
    if (entry.id) {
      const { error } = await supabase
        .from('entries')
        .update({
          content: entry.content,
          is_complete: entry.is_complete,
          is_test: entry.is_test,
          day_number: entry.day_number,
        })
        .eq('id', entry.id)

      if (error) {
        console.error('Failed to update entry:', error)
        return { error }
      }
    } else {
      const { error } = await supabase
        .from('entries')
        .insert({
          family_id: familyId,
          week_id: weekId,
          date: entry.date,
          person: entry.person,
          category: entry.category,
          content: entry.content || '',
          is_complete: entry.is_complete || false,
          is_test: entry.is_test || false,
          day_number: entry.day_number || null,
          sort_order: entry.sort_order || 0,
        })

      if (error) {
        console.error('Failed to insert entry:', error)
        return { error }
      }
    }

    // Local reload happens immediately; realtime handles the other client
    await loadEntries()
    return { error: null }
  }

  const deleteEntry = async (id) => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete entry:', error)
      return { error }
    }

    await loadEntries()
    return { error: null }
  }

  const isManual = (e) => (e.source ?? 'manual') === 'manual'

  // The hand-typed entry for a cell (one per cell, as before).
  const getEntry = (person, category, date) => {
    return entries.find(e => e.person === person && e.category === category && e.date === date && isManual(e)) || null
  }

  // Items pulled in from a calendar feed for a cell. Tests first.
  const getItems = (person, category, date) => {
    return entries
      .filter(e => e.person === person && e.category === category && e.date === date && !isManual(e))
      .sort((a, b) => (b.is_test ? 1 : 0) - (a.is_test ? 1 : 0) || a.content.localeCompare(b.content))
  }

  // Check a synced item off (or back on) without touching anything else.
  const setItemComplete = async (id, isComplete) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, is_complete: isComplete } : e)))
    const { error } = await supabase.from('entries').update({ is_complete: isComplete }).eq('id', id)
    if (error) {
      console.error('Failed to update item:', error)
      await loadEntries()
    }
    return { error }
  }

  return { entries, loading, stale, upsertEntry, deleteEntry, getEntry, getItems, setItemComplete, reload: loadEntries }
}
