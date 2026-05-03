import { useState, useEffect } from 'react'
import api from '../services/api'

// ── Mapa de ícones por código OpenWeather ─────────────────────
function getWeatherEmoji(icon) {
  const code = icon?.replace('d', '').replace('n', '')
  const map = {
    '01': '☀️',
    '02': '🌤️',
    '03': '☁️',
    '04': '☁️',
    '09': '🌧️',
    '10': '🌦️',
    '11': '⛈️',
    '13': '❄️',
    '50': '🌫️',
  }
  return map[code] || '🌡️'
}

// ── Formata data curta ────────────────────────────────────────
function formatDay(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (date.toDateString() === today.toDateString())    return 'Hoje'
  if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã'

  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
}

// ── Capitaliza primeira letra ─────────────────────────────────
function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function WeatherCard({ destination }) {
  const [weather, setWeather]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!destination) {
      setLoading(false)
      return
    }
    fetchWeather()
  }, [destination])

  async function fetchWeather() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/weather', {
        params: { destination },
      })
      setWeather(response.data)
    } catch (err) {
      const msg = err.response?.data?.message
      if (msg?.includes('city not found') || err.response?.status === 404) {
        setError('Destino não encontrado na base de dados climáticos')
      } else {
        setError('Não foi possível carregar a previsão do tempo')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Sem destino ───────────────────────────────────────────
  if (!destination) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400">
        <p className="text-3xl mb-2">🌍</p>
        <p className="text-sm">Adicione um destino à viagem para ver a previsão do tempo</p>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="border rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-40" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // ── Erro ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-medium text-orange-700">{error}</p>
          <button
            onClick={fetchWeather}
            className="text-xs text-orange-600 hover:underline mt-1"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const { current, daily, city, country } = weather

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">

      {/* ── Clima atual ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium opacity-80">
            📍 {city}, {country}
          </p>
          <button
            onClick={fetchWeather}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity"
            title="Atualizar"
          >
            🔄
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-6xl">
            {getWeatherEmoji(current.icon)}
          </span>
          <div>
            <p className="text-5xl font-bold leading-none">
              {current.temp}°
            </p>
            <p className="text-sm opacity-80 mt-1 capitalize">
              {capitalize(current.description)}
            </p>
            <p className="text-xs opacity-70 mt-0.5">
              Sensação {current.feelsLike}° · {current.tempMin}° / {current.tempMax}°
            </p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
          <div className="flex items-center gap-1.5">
            <span>💧</span>
            <span className="opacity-90">{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>💨</span>
            <span className="opacity-90">{current.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* ── Previsão 5 dias ────────────────────────────────── */}
      <div className="bg-white">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>📅 Previsão para 5 dias</span>
          <span className="text-gray-400 text-xs">
            {expanded ? '▲ Recolher' : '▼ Expandir'}
          </span>
        </button>

        {expanded && (
          <div className="grid grid-cols-5 gap-2 px-4 pb-4">
            {daily.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center bg-gray-50 rounded-xl p-2 border hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-600 text-center">
                  {formatDay(day.date)}
                </p>
                <span className="text-2xl my-1.5">
                  {getWeatherEmoji(day.icon)}
                </span>
                <p className="text-xs font-bold text-gray-800">
                  {day.tempMax}°
                </p>
                <p className="text-xs text-gray-400">
                  {day.tempMin}°
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  💧{day.humidity}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
