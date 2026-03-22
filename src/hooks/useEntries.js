import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEntries(weekId, userId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!weekId || !userId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('week_id', weekId)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) console.error('Failed to load entries:', error)
    else setEntries(data || [])
    setLoading(false)
  }, [weekId, userId])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const upsertEntry = async (entry) => {
    if (entry.id) {
      // Update
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
      // Insert
      const { error } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
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
