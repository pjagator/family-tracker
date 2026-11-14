import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'

export function useFamily(userId) {
  const [family, setFamily] = useState(null)
  // Which user the current answer belongs to. Until the lookup for THIS user
  // has finished we are still loading; otherwise a signed-in parent briefly
  // (or, on a slow connection, lengthily) saw the create-a-family screen.
  const [loadedFor, setLoadedFor] = useState(null)
  const [error, setError] = useState(null)
  const loading = Boolean(userId) && loadedFor !== userId

  const loadFamily = useCallback(async () => {
    if (!userId) { setFamily(null); setError(null); setLoadedFor(null); return }

    // Paint the saved copy first so a slow connection never blocks the app.
    const cacheKey = `family_${userId}`
    const cached = cacheGet(cacheKey)
    if (cached) {
      setFamily(cached)
      setLoadedFor(userId)
    }

    const { data: membership, error: loadErr } = await supabase
      .from('family_members')
      .select('family_id, role, families(id, name, invite_code)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (loadErr) {
      // A failed request is NOT the same as "no family". Treating it that way
      // used to drop a signed-in parent onto the create-a-family screen.
      console.error('Failed to load family:', loadErr)
      if (!cached) setError(loadErr)
    } else if (!membership) {
      setFamily(null)
      setError(null)
    } else {
      const fam = { ...membership.families, role: membership.role }
      setFamily(fam)
      setError(null)
      cacheSet(cacheKey, fam)
    }
    setLoadedFor(userId)
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

  return { family, loading, error, reload: loadFamily, createFamily, joinFamily }
}
