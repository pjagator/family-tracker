import WeekNav from './WeekNav'
import WeekGrid from './WeekGrid'

export default function WeekView({ week, weekDates, dayNumbers, onDayNumberChange, entries, onPrev, onNext, onToday, onCellTap, getEntry }) {
  return (
    <div className="pb-20">
      <WeekNav
        weekDates={weekDates}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />

      {weekDates.length > 0 && (
        <WeekGrid
          weekDates={weekDates}
          dayNumbers={dayNumbers}
          onDayNumberChange={onDayNumberChange}
          onCellTap={onCellTap}
          getEntry={getEntry}
        />
      )}
    </div>
  )
}
