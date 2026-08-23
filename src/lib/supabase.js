import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    'Missing Supabase config. Create a .env.local file with VITE_SUPABASE_URL ' +
    'and VITE_SUPABASE_ANON_KEY (see .env.local.example), then restart the dev server.'
  // Surface a visible message instead of a blank white screen.
  if (typeof document !== 'undefined') {
    const render = () => {
      const root = document.getElementById('root')
      if (root) {
        root.innerHTML =
          '<div style="font-family:Inter,system-ui,sans-serif;max-width:32rem;margin:15vh auto;' +
          'padding:1.5rem;color:#1a2744;line-height:1.6">' +
          '<h1 style="font-size:1.125rem;font-weight:700;margin-bottom:.5rem">Configuration needed</h1>' +
          '<p style="font-size:1rem">' + msg + '</p></div>'
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render)
    } else {
      render()
    }
  }
  throw new Error(msg)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
