import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEntries(weekId, familyId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!weekId || !familyId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('week_id', weekId)
      .eq('family_id', familyId)
      .order('sort_order', { ascending: true })

    if (error) console.error('Failed to load entries:', error)
    else setEntries(data || [])
    setLoading(false)
  }, [weekId, familyId])

  // Initial load
  useEffect(() => {
    loadEntries()
  }, [loadEntries])

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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [weekId, familyId, loadEntries])

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

  const getEntry = (person, category, date) => {
    return entries.find(e => e.person === person && e.category === category && e.date === date) || null
  }

  return { entries, loading, upsertEntry, deleteEntry, getEntry, reload: loadEntries }
}
