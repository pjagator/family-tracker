import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useFamily } from './hooks/useFamily'
import { useWeek } from './hooks/useWeek'
import { useEntries } from './hooks/useEntries'
import Auth from './components/Auth'
import FamilySetup from './components/FamilySetup'
import WeekView from './components/WeekView'
import EntrySheet from './components/EntrySheet'
import BottomNav from './components/BottomNav'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const { family, loading: familyLoading, createFamily, joinFamily } = useFamily(user?.id)
  const { week, weekDates, dayNumbers, loading: weekLoading, goToPrevWeek, goToNextWeek, goToToday, setDayNumber } = useWeek(family?.id)
  const { entries, upsertEntry, deleteEntry, getEntry } = useEntries(week?.id, family?.id)

  const [activeTab, setActiveTab] = useState('week')
  const [activeCell, setActiveCell] = useState(null)

  // Loading
  if (authLoading || (user && familyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-white text-sm">Loading...</div>
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return <Auth onSignIn={signIn} onSignUp={signUp} />
  }

  // Signed in but no family
  if (!family) {
    return <FamilySetup onCreateFamily={createFamily} onJoinFamily={joinFamily} />
  }

  return (
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
              onDayNumberChange={setDayNumber}
              entries={entries}
              onPrev={goToPrevWeek}
              onNext={goToNextWeek}
              onToday={goToToday}
              onCellTap={(cell) => setActiveCell(cell)}
              getEntry={getEntry}
            />
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <div className="p-6 pb-24">
          <h2 className="text-lg font-bold text-navy mb-4">Settings</h2>
          <p className="text-sm text-slate mb-2">{user.email}</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-slate mb-1">Family: <span className="font-semibold text-navy">{family.name}</span></p>
            <p className="text-xs text-slate">
              Invite code: <span className="font-mono font-semibold text-navy tracking-wider">{family.invite_code}</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Share this code so others can join your family.</p>
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
  )
}
