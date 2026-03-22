import { useWeather } from '../hooks/useWeather'

const GRID_COLS = '90px repeat(7, 1fr)'

export default function WeatherRow({ weekDates }) {
  const { weather, loading } = useWeather(weekDates)

  return (
    <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>
      <div className="bg-gray-50 border border-t-0 border-[#e2e8f0] p-1.5 text-[11px] font-medium text-slate sticky left-0 z-10 flex items-center justify-center">
        Weather
      </div>
      {weekDates.map((date) => {
        const w = weather[date]
        return (
          <div
            key={date}
            className="bg-gray-50/50 border border-t-0 border-l-0 border-[#e2e8f0] p-1 text-center text-[11px] text-slate flex items-center justify-center min-h-[32px]"
          >
            {loading ? (
              <span className="text-gray-300">...</span>
            ) : w ? (
              <span>
                <span className="font-semibold text-gray-700">{w.high}°</span>
                <span className="text-gray-400"> / {w.low}°</span>
              </span>
            ) : (
              <span className="text-gray-300">--</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
