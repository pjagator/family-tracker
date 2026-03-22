import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWords(weekId, familyId) {
  const [words, setWords] = useState({ vocab: [], spelling: [] })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!weekId || !familyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('weekly_words')
      .select('*')
      .eq('week_id', weekId)
      .eq('family_id', familyId)
      .eq('person', 'lucia')

    if (error) {
      console.error('Failed to load words:', error)
    } else {
      const vocab = data?.find(d => d.word_type === 'vocab')
      const spelling = data?.find(d => d.word_type === 'spelling')
      setWords({
        vocab: vocab?.words || [],
        spelling: spelling?.words || [],
        vocabId: vocab?.id || null,
        spellingId: spelling?.id || null,
      })
    }
    setLoading(false)
  }, [weekId, familyId])

  useEffect(() => { load() }, [load])

  const saveWords = async (wordType, wordList) => {
    const existing = wordType === 'vocab' ? words.vocabId : words.spellingId
    if (existing) {
      const { error } = await supabase
        .from('weekly_words')
        .update({ words: wordList })
        .eq('id', existing)
      if (error) return { error }
    } else {
      const { error } = await supabase
        .from('weekly_words')
        .insert({
          family_id: familyId,
          week_id: weekId,
          person: 'lucia',
          word_type: wordType,
          words: wordList,
        })
      if (error) return { error }
    }
    await load()
    return { error: null }
  }

  return { words, loading, saveWords }
}
