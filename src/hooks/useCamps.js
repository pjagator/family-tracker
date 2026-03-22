import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCamps(familyId) {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!familyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('summer_camps')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at')
    if (error) console.error('Failed to load camps:', error)
    else setCamps(data || [])
    setLoading(false)
  }, [familyId])

  useEffect(() => { load() }, [load])

  const upsert = async (camp) => {
    if (camp.id) {
      const { error } = await supabase
        .from('summer_camps')
        .update({
          week_name: camp.week_name,
          dates: camp.dates,
          camp_name: camp.camp_name,
          is_registered: camp.is_registered,
          notes: camp.notes,
        })
        .eq('id', camp.id)
      if (error) return { error }
    } else {
      const { error } = await supabase
        .from('summer_camps')
        .insert({
          family_id: familyId,
          week_name: camp.week_name || '',
          dates: camp.dates || '',
          person: camp.person,
          camp_name: camp.camp_name || '',
          is_registered: camp.is_registered || false,
          notes: camp.notes || '',
        })
      if (error) return { error }
    }
    await load()
    return { error: null }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('summer_camps').delete().eq('id', id)
    if (error) return { error }
    await load()
    return { error: null }
  }

  return { camps, loading, upsert, remove, reload: load }
}
