import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFamily(userId) {
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadFamily = useCallback(async () => {
    if (!userId) { setLoading(false); return }

    const { data: membership, error } = await supabase
      .from('family_members')
      .select('family_id, role, families(id, name, invite_code)')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (error || !membership) {
      setFamily(null)
    } else {
      setFamily({ ...membership.families, role: membership.role })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadFamily()
  }, [loadFamily])

  const createFamily = async (name) => {
    // Create the family
    const { data: fam, error: famErr } = await supabase
      .from('families')
      .insert({ name, created_by: userId })
      .select()
      .single()

    if (famErr) return { error: famErr }

    // Add current user as owner
    const { error: memErr } = await supabase
      .from('family_members')
      .insert({ family_id: fam.id, user_id: userId, role: 'owner' })

    if (memErr) return { error: memErr }

    await loadFamily()
    return { error: null }
  }

  const joinFamily = async (inviteCode) => {
    // Look up family by invite code
    const { data: fam, error: lookupErr } = await supabase
      .from('families')
      .select('id')
      .eq('invite_code', inviteCode.trim().toLowerCase())
      .single()

    if (lookupErr || !fam) return { error: { message: 'Invalid invite code.' } }

    // Join as member
    const { error: joinErr } = await supabase
      .from('family_members')
      .insert({ family_id: fam.id, user_id: userId, role: 'member' })

    if (joinErr) {
      if (joinErr.code === '23505') return { error: { message: 'You already belong to this family.' } }
      return { error: joinErr }
    }

    await loadFamily()
    return { error: null }
  }

  return { family, loading, createFamily, joinFamily }
}
