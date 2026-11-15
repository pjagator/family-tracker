import { useState, useEffect } from 'react'
import { ToastProvider } from './components/ToastContext'
import { useAuth } from './hooks/useAuth'
import { useFamily } from './hooks/useFamily'
import { useWeek } from './hooks/useWeek'
import { useEntries } from './hooks/useEntries'
import { useRecurring } from './hooks/useRecurring'
import { useCamps } from './hooks/useCamps'
import { useWords } from './hooks/useWords'
import Auth from './components/Auth'
import FamilySetup from './components/FamilySetup'
import WeekView from './components/WeekView'
import EntrySheet from './components/EntrySheet'
import RecurringManager from './components/RecurringManager'
import FeedsManager from './components/FeedsManager'
import { useFeeds } from './hooks/useFeeds'
import CampView from './components/CampView'
import BottomNav from './components/BottomNav'
import SplashScreen from './components/SplashScreen'
import { useResume } from './hooks/useResume'
import { supabase } from './lib/supabase'
import { cacheClearAll } from './lib/cache'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut, sendOtp, verifyOtp, resetPassword } = useAuth()
  const { family, loading: familyLoading, error: familyError, reload: reloadFamily, createFamily, joinFamily } = useFamily(user?.id)
  const {
    week, weekDates, dayNumbers, globalNoSchool, personNoSchool, loading: weekLoading,
    error: weekError, reload: reloadWeek,
    goToPrevWeek, goToNextWeek, goToToday,
    setDayNumber, toggleGlobalNoSchool, togglePersonNoSchool,
  } = useWeek(family?.id)
  const {
    entries, stale: entriesStale, upsertEntry, deleteEntry, getEntry, getItems, setItemComplete,
    reload: reloadEntries,
  } = useEntries(week?.id, family?.id)
  const { feeds, syncing, add: addFeed, remove: removeFeed, syncNow } = useFeeds(family?.id)
  const afterSync = async (result) => { await reloadEntries(); return result }
  const { items: recurringItems, add: addRecurring, remove: removeRecurring } = useRecurring(family?.id)
  const { camps, upsert: upsertCamp, remove: removeCamp } = useCamps(family?.id)
  const { words, saveWords } = useWords(week?.id, family?.id)

  const [activeTab, setActiveTab] = useState('week')
  const [activeCell, setActiveCell] = useState(null)

  const [showSplash, setShowSplash] = useState(true)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    // Full 2s splash only on cold start; repeat opens in the same browser
    // session get 400ms so speed of entry isn't taxed every open.
    let seen = false
    try { seen = sessionStorage.getItem('ft_splash_seen') === '1' } catch { /* private mode */ }
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
      try { sessionStorage.setItem('ft_splash_seen', '1') } catch { /* ignore */ }
    }, seen ? 400 : 2000)
    return () => clearTimeout(timer)
  }, [])

  const [exportMsg, setExportMsg] = useState('')

  const exportWeekAsText = () => {
    if (!weekDates.length || !entries.length) {
      setExportMsg('No data to export.')
      setTimeout(() => setExportMsg(''), 2000)
      return
    }
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const start = new Date(weekDates[0] + 'T00:00:00')
    const end = new Date(weekDates[6] + 'T00:00:00')
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    let text = `Week of ${fmt(start)} - ${fmt(end)}, ${start.getFullYear()}\n`
    text += '='.repeat(40) + '\n\n'

    const people = ['beau', 'lucia', 'niva', 'allie', 'patrick']
    for (const person of people) {
      const personEntries = entries.filter(e => e.person === person && e.content)
      if (!personEntries.length) continue
      text += person.charAt(0).toUpperCase() + person.slice(1) + '\n'
      text += '-'.repeat(20) + '\n'
      for (let i = 0; i < 7; i++) {
        const dayEntries = personEntries.filter(e => e.date === weekDates[i])
        if (!dayEntries.length) continue
        text += `  ${dayNames[i]} ${new Date(weekDates[i] + 'T00:00:00').getMonth() + 1}/${new Date(weekDates[i] + 'T00:00:00').getDate()}:\n`
        for (const e of dayEntries) {
          const flags = []
          if (e.is_test) flags.push('TEST')
          if (e.is_complete) flags.push('DONE')
          text += `    [${e.category}] ${e.content}${flags.length ? ' (' + flags.join(', ') + ')' : ''}\n`
        }
      }
      text += '\n'
    }

    navigator.clipboard.writeText(text).then(() => {
      setExportMsg('Copied to clipboard!')
      setTimeout(() => setExportMsg(''), 2000)
    }).catch(() => {
      setExportMsg('Copy failed.')
      setTimeout(() => setExportMsg(''), 2000)
    })
  }

  const handleAllieToggle = async (entry) => {
    await upsertEntry({ ...entry, is_complete: false, is_test: false })
  }

  const allDataReady = !authLoading && (
    !user ||                                          // auth resolved, no user → show login
    (!familyLoading && !family) ||                    // user exists but no family → show setup (or load error)
    (!familyLoading && family && !weekLoading)         // full app ready
  )
  const splashReady = allDataReady && minTimeElapsed

  // If startup has not finished after 10 seconds, stop pretending and offer a
  // way out. The splash used to sit there indefinitely on a bad connection.
  const [stalled, setStalled] = useState(false)
  useEffect(() => {
    if (allDataReady) return
    const timer = setTimeout(() => setStalled(true), 10000)
    return () => { clearTimeout(timer); setStalled(false) }
  }, [allDataReady])

  const resetSignIn = async () => {
    cacheClearAll()
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])
    } catch { /* fall through to reload */ }
    window.location.reload()
  }

  // Pick up new deploys. An installed iPhone web app can stay "open" for weeks,
  // so the page itself has to notice a new version and reload.
  useResume(() => {
    if (__BUILD_ID__ === 'dev' || activeCell) return
    fetch('/version.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (info?.build && info.build !== __BUILD_ID__) window.location.reload()
      })
      .catch(() => { /* offline: try again next time */ })
  })

  // Determine what content to show beneath the splash
  const showAuth = !authLoading && !user
  const showFamilyError = !authLoading && user && !familyLoading && !family && familyError
  const showFamilySetup = !authLoading && user && !familyLoading && !family && !familyError

  return (
    <ToastProvider>
    <div className="min-h-screen bg-white">
      {/* Splash screen overlay — covers everything with z-50 */}
      {showSplash && (
        <SplashScreen
          isReady={splashReady}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* Startup is taking too long: explain and offer a way out */}
      {showSplash && stalled && !allDataReady && (
        <div className="fixed inset-x-4 bottom-10 z-[60] bg-white rounded-xl shadow-xl p-4 text-center">
          <p className="text-base font-semibold text-navy mb-1">Still loading</p>
          <p className="text-sm text-slate mb-3">
            This usually means a weak connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-[44px] bg-navy text-white rounded-lg text-sm font-medium active:scale-[0.98] transition"
          >
            Try again
          </button>
          <button
            onClick={resetSignIn}
            className="w-full min-h-[44px] mt-2 text-sm text-slate active:bg-gray-50 rounded-lg transition"
          >
            Sign in again
          </button>
        </div>
      )}

      {/* Signed in, but the family lookup failed (network), so do not show setup */}
      {showFamilyError && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <p className="text-lg font-bold text-navy mb-1">Can't reach the tracker</p>
          <p className="text-sm text-slate mb-4">Check your connection and try again.</p>
          <button
            onClick={reloadFamily}
            className="min-h-[44px] px-6 bg-navy text-white rounded-lg text-sm font-medium active:scale-[0.98] transition"
          >
            Try again
          </button>
        </div>
      )}

      {/* Auth screen (rendered behind splash when not logged in) */}
      {showAuth && (
        <Auth
          onSignIn={signIn}
          onSignUp={signUp}
          onSendOtp={sendOtp}
          onVerifyOtp={verifyOtp}
          onResetPassword={resetPassword}
        />
      )}

      {/* Family setup (rendered behind splash after login if no family) */}
      {showFamilySetup && (
        <FamilySetup onCreateFamily={createFamily} onJoinFamily={joinFamily} />
      )}

      {/* Main app content — only render when user and family exist */}
      {user && family && <>
      {activeTab === 'week' && (
        <div className="animate-fadeIn">
          {entriesStale && !weekLoading && week && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs text-center px-3 py-2">
              Offline. Showing the last saved copy; it will refresh when you reconnect.
            </div>
          )}
          {weekLoading ? (
            <div className="bg-navy text-white px-4 py-8 text-center text-sm animate-pulse">Loading week...</div>
          ) : !week ? (
            <div className="p-6 pt-16 text-center">
              <p className="text-lg font-bold text-navy mb-1">Couldn't load this week</p>
              <p className="text-sm text-slate mb-4">
                {weekError?.message || 'Check your connection and try again.'}
              </p>
              <button
                onClick={reloadWeek}
                className="min-h-[44px] px-6 bg-navy text-white rounded-lg text-sm font-medium active:scale-[0.98] transition"
              >
                Try again
              </button>
              <div className="mt-3">
                <button onClick={goToToday} className="min-h-[44px] px-4 text-sm text-slate">
                  Back to this week
                </button>
              </div>
            </div>
          ) : (
            <WeekView
              week={week}
              weekDates={weekDates}
              dayNumbers={dayNumbers}
              globalNoSchool={globalNoSchool}
              personNoSchool={personNoSchool}
              onDayNumberChange={setDayNumber}
              onToggleGlobalNoSchool={toggleGlobalNoSchool}
              onTogglePersonNoSchool={togglePersonNoSchool}
              entries={entries}
              onPrev={goToPrevWeek}
              onNext={goToNextWeek}
              onToday={goToToday}
              onCellTap={(cell) => setActiveCell(cell)}
              onAllieToggle={handleAllieToggle}
              getEntry={getEntry}
              getItems={getItems}
              words={words}
              onSaveWords={saveWords}
            />
          )}
        </div>
      )}

      {activeTab === 'camps' && (
        <div className="animate-fadeIn">
          <CampView camps={camps} onUpsert={upsertCamp} onRemove={removeCamp} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fadeIn">
        <div className="p-6 pb-24">
          <h2 className="text-lg font-bold text-navy mb-4">Settings</h2>
          <p className="text-sm text-slate mb-2">{user.email}</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate mb-1">Family: <span className="font-semibold text-navy">{family.name}</span></p>
            <p className="text-xs text-slate">
              Invite code: <span className="font-mono font-semibold text-navy tracking-wider">{family.invite_code}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Share this code so others can join your family.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-semibold text-navy mb-2">Export</h3>
            <button
              onClick={exportWeekAsText}
              className="w-full py-2 bg-navy text-white rounded text-sm font-medium active:scale-[0.98] transition"
            >
              Copy current week to clipboard
            </button>
            {exportMsg && <p className="text-xs text-complete text-center mt-2">{exportMsg}</p>}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <FeedsManager
              feeds={feeds}
              syncing={syncing}
              onAdd={async (feed) => afterSync(await addFeed(feed))}
              onRemove={async (id) => afterSync(await removeFeed(id))}
              onSyncNow={async () => afterSync(await syncNow())}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <RecurringManager
              items={recurringItems}
              onAdd={addRecurring}
              onRemove={removeRecurring}
            />
          </div>

          <button
            onClick={signOut}
            className="w-full py-3 border border-gray-200 rounded-lg text-sm text-slate active:bg-gray-50 transition"
          >
            Sign out
          </button>
          <p className="text-xs text-gray-400 text-center mt-4">Version {__BUILD_ID__}</p>
        </div>
        </div>
      )}

      <EntrySheet
        cell={activeCell}
        onSave={upsertEntry}
        onDelete={deleteEntry}
        onToggleItem={setItemComplete}
        onClose={() => setActiveCell(null)}
      />

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
      </>}
    </div>
    </ToastProvider>
  )
}
