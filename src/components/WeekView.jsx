import WeekGrid from './WeekGrid'
import WordList from './WordList'
import { useSwipe } from '../hooks/useSwipe'
import { useMobileView } from '../hooks/useMobileView'

export default function WeekView({
  week, weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  entries, onPrev, onNext, onToday, onCellTap, onAllieToggle, getEntry,
  words, onSaveWords,
}) {
  const { isMobile } = useMobileView()

  // On mobile, CSS scroll-snap handles within-week scrolling — no swipe for week nav
  // On desktop, swipe still changes weeks
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: isMobile ? null : onNext,
    onSwipeRight: isMobile ? null : onPrev,
  })

  return (
    <div className="pb-20" onTouchStart={isMobile ? undefined : onTouchStart} onTouchEnd={isMobile ? undefined : onTouchEnd}>
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
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
            isMobile={isMobile}
          />

          {/* Lucia's weekly words */}
          <div className="mt-3 mx-0">
            <div className="px-3 py-2" style={{ backgroundColor: '#5b3a6b' }}>
              <span className="text-[12px] font-bold text-white">🎨 Lucia's Words</span>
            </div>
            <div className="bg-white border border-slate-300 border-t-0">
              <WordList type="vocab" words={words?.vocab || []} onSave={onSaveWords} />
              <WordList type="spelling" words={words?.spelling || []} onSave={onSaveWords} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
