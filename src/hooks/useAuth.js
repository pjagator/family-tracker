import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { cacheClearAll } from '../lib/cache'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const settle = (session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setLoading(false)
    }

    // Whichever answers first wins. A failed session check shows the sign-in
    // screen instead of leaving the splash up forever.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      settle(session)
    })
    supabase.auth.getSession()
      .then(({ data }) => settle(data?.session ?? null))
      .catch((err) => {
        console.error('Session check failed:', err)
        settle(null)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    cacheClearAll()
    return supabase.auth.signOut()
  }

  const sendOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  }

  const verifyOtp = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return { error }
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    })
    return { error }
  }

  return { user, loading, signIn, signUp, signOut, sendOtp, verifyOtp, resetPassword }
}
