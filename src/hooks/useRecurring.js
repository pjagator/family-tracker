import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRecurring(familyId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!familyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('recurring')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('person')
      .order('day_of_week')
    if (error) console.error('Failed to load recurring:', error)
    else setItems(data || [])
    setLoading(false)
  }, [familyId])

  useEffect(() => { load() }, [load])

  const add = async (item) => {
    const { error } = await supabase.from('recurring').insert({
      family_id: familyId,
      person: item.person,
      category: item.category,
      day_of_week: item.day_of_week,
      content: item.content,
    })
    if (error) return { error }
    await load()
    return { error: null }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('recurring').delete().eq('id', id)
    if (error) return { error }
    await load()
    return { error: null }
  }

  return { items, loading, add, remove, reload: load }
}
