import WeekNav from './WeekNav'
import PersonSection from './PersonSection'
import BeauGrid from './BeauGrid'

export default function WeekView({ week, weekDates, entries, onPrev, onNext, onToday, onCellTap, getEntry }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="pb-20">
      <WeekNav
        weekDates={weekDates}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />

      {weekDates.length > 0 && (
        <PersonSection name="Beau" defaultOpen>
          <BeauGrid
            weekDates={weekDates}
            today={today}
            onCellTap={onCellTap}
            getEntry={getEntry}
          />
        </PersonSection>
      )}
    </div>
  )
}
