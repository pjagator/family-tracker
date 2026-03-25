import { useWeather } from '../hooks/useWeather'

function weatherEmoji(code) {
  if (code === undefined || code === null) return ''
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '🌨️'
  if (code >= 80 && code <= 82) return '🌧️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '☁️'
}

export default function WeatherRow({ weekDates, visibleDates, gridCols }) {
  const { weather, loading } = useWeather(weekDates)
  const dates = visibleDates || weekDates

  return (
    <div className="grid" style={{ gridTemplateColumns: gridCols || '90px repeat(7, 1fr)' }}>
      <div className="bg-gray-50 border border-slate-300 p-1.5 text-[11px] font-medium text-slate sticky left-0 z-10 flex items-center justify-center">
        Weather
      </div>
      {dates.map((date) => {
        const w = weather[date]
        return (
          <div
            key={date}
            className="bg-gray-50/50 border border-slate-300 p-1 text-center text-[11px] text-slate flex items-center justify-center min-h-[44px]"
          >
            {loading ? (
              <span className="text-gray-400">...</span>
            ) : w ? (
              <span>
                <span className="mr-0.5">{weatherEmoji(w.code)}</span>
                <span className="font-semibold text-gray-700">{w.high}°</span>
                <span className="text-gray-400">/{w.low}°</span>
              </span>
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
