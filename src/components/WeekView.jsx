import WeekNav from './WeekNav'
import WeekGrid from './WeekGrid'

export default function WeekView({ week, weekDates, dayNumbers, noSchoolDays, onDayNumberChange, onToggleNoSchool, entries, onPrev, onNext, onToday, onCellTap, getEntry }) {
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
          noSchoolDays={noSchoolDays}
          onDayNumberChange={onDayNumberChange}
          onToggleNoSchool={onToggleNoSchool}
          onCellTap={onCellTap}
          getEntry={getEntry}
        />
      )}
    </div>
  )
}
