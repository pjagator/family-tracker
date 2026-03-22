import WeekNav from './WeekNav'
import WeekGrid from './WeekGrid'
import WordList from './WordList'
import { useSwipe } from '../hooks/useSwipe'

export default function WeekView({
  week, weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  entries, onPrev, onNext, onToday, onCellTap, onAllieToggle, getEntry,
  words, onSaveWords,
}) {
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
  })

  return (
    <div className="pb-20" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <WeekNav
        weekDates={weekDates}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />

      {weekDates.length > 0 && (
        <>
          <WeekGrid
            weekDates={weekDates}
            dayNumbers={dayNumbers}
            globalNoSchool={globalNoSchool}
            personNoSchool={personNoSchool}
            onDayNumberChange={onDayNumberChange}
            onToggleGlobalNoSchool={onToggleGlobalNoSchool}
            onTogglePersonNoSchool={onTogglePersonNoSchool}
            onCellTap={onCellTap}
            onAllieToggle={onAllieToggle}
            getEntry={getEntry}
          />

          {/* Lucia's weekly words */}
          <div className="mt-3 mx-0">
            <div className="px-3 py-2" style={{ backgroundColor: '#5b3a6b' }}>
              <span className="text-[12px] font-bold text-white">Lucia's Words</span>
            </div>
            <div className="bg-white border border-[#e2e8f0] border-t-0">
              <WordList type="vocab" words={words?.vocab || []} onSave={onSaveWords} />
              <WordList type="spelling" words={words?.spelling || []} onSave={onSaveWords} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
