import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useWeek } from './hooks/useWeek'
import { useEntries } from './hooks/useEntries'
import Auth from './components/Auth'
import WeekView from './components/WeekView'
import EntrySheet from './components/EntrySheet'
import BottomNav from './components/BottomNav'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const { week, weekDates, loading: weekLoading, goToPrevWeek, goToNextWeek, goToToday } = useWeek(user?.id)
  const { entries, upsertEntry, deleteEntry, getEntry } = useEntries(week?.id, user?.id)

  const [activeTab, setActiveTab] = useState('week')
  const [activeCell, setActiveCell] = useState(null)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-white text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth onSignIn={signIn} onSignUp={signUp} />
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
          <p className="text-sm text-slate mb-6">{user.email}</p>
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
