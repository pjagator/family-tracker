import WeekNav from './WeekNav'
import WeekGrid from './WeekGrid'

export default function WeekView({
  week, weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  entries, onPrev, onNext, onToday, onCellTap, onAllieToggle, getEntry,
}) {
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
          globalNoSchool={globalNoSchool}
          personNoSchool={personNoSchool}
          onDayNumberChange={onDayNumberChange}
          onToggleGlobalNoSchool={onToggleGlobalNoSchool}
          onTogglePersonNoSchool={onTogglePersonNoSchool}
          onCellTap={onCellTap}
          onAllieToggle={onAllieToggle}
          getEntry={getEntry}
        />
      )}
    </div>
  )
}
