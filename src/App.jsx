import { useState } from 'react'
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
import CampView from './components/CampView'
import BottomNav from './components/BottomNav'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut, sendOtp, verifyOtp, resetPassword } = useAuth()
  const { family, loading: familyLoading, createFamily, joinFamily } = useFamily(user?.id)
  const {
    week, weekDates, dayNumbers, globalNoSchool, personNoSchool, loading: weekLoading,
    goToPrevWeek, goToNextWeek, goToToday,
    setDayNumber, toggleGlobalNoSchool, togglePersonNoSchool,
  } = useWeek(family?.id)
  const { entries, upsertEntry, deleteEntry, getEntry } = useEntries(week?.id, family?.id)
  const { items: recurringItems, add: addRecurring, remove: removeRecurring } = useRecurring(family?.id)
  const { camps, upsert: upsertCamp, remove: removeCamp } = useCamps(family?.id)
  const { words, saveWords } = useWords(week?.id, family?.id)

  const [activeTab, setActiveTab] = useState('week')
  const [activeCell, setActiveCell] = useState(null)

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

  if (authLoading || (user && familyLoading)) {
    return (
      <ToastProvider>
        <div className="min-h-screen flex items-center justify-center bg-navy">
          <div className="text-white text-sm">Loading...</div>
        </div>
      </ToastProvider>
    )
  }

  if (!user) {
    return <ToastProvider><Auth onSignIn={signIn} onSignUp={signUp} onSendOtp={sendOtp} onVerifyOtp={verifyOtp} onResetPassword={resetPassword} /></ToastProvider>
  }

  if (!family) {
    return <ToastProvider><FamilySetup onCreateFamily={createFamily} onJoinFamily={joinFamily} /></ToastProvider>
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-white">
      {activeTab === 'week' && (
        <>
          {weekLoading ? (
            <div className="bg-navy text-white px-4 py-4 text-center text-sm">Loading week...</div>
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
              words={words}
              onSaveWords={saveWords}
            />
          )}
        </>
      )}

      {activeTab === 'camps' && (
        <CampView camps={camps} onUpsert={upsertCamp} onRemove={removeCamp} />
      )}

      {activeTab === 'settings' && (
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
        </div>
      )}

      <EntrySheet
        cell={activeCell}
        onSave={upsertEntry}
        onDelete={deleteEntry}
        onClose={() => setActiveCell(null)}
      />

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
    </ToastProvider>
  )
}
