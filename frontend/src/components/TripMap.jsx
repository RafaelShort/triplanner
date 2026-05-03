import { useEffect, useState } from 'react'
// ✅ useMapEvents removido — não era usado
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../services/api'

// ── Fix ícones padrão do Leaflet ──────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TYPE_CONFIG = {
  ACTIVITY:      { color: '#3b82f6', emoji: '🎯', label: 'Atividade' },
  RESTAURANT:          { color: '#f59e0b', emoji: '🍽️', label: 'Refeição' },
  ACCOMMODATION: { color: '#8b5cf6', emoji: '🏨', label: 'Hospedagem' },
  TRANSPORT:     { color: '#10b981', emoji: '🚗', label: 'Transporte' },
  OTHER:         { color: '#6b7280', emoji: '📌', label: 'Outro' },
}

function createCustomIcon(type) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER
  return L.divIcon({
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <div style="
          background:${config.color};
          width:36px;height:36px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
        "></div>
        <span style="position:absolute;top:4px;left:4px;font-size:16px;line-height:1;">
          ${config.emoji}
        </span>
      </div>
    `,
    className:   '',
    iconSize:    [36, 36],
    iconAnchor:  [18, 36],
    popupAnchor: [0, -38],
  })
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 14)
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] })
    }
  }, [positions.join(','), map])
  return null
}

function MapLegend({ types }) {
  if (types.length === 0) return null
  return (
    <div className="absolute bottom-6 left-3 z-[1000] bg-white rounded-xl shadow-md border p-3 flex flex-col gap-1.5 text-xs">
      {types.map((type) => {
        const config = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER
        return (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-gray-600">{config.emoji} {config.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function TripMap({ tripId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    fetchActivities()
  }, [tripId])

  async function fetchActivities() {
    try {
      const response = await api.get(`/trips/${tripId}/activities`)
      setActivities(response.data.activities || response.data || [])
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-96 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando mapa...</p>
      </div>
    )
  }

  const mapped      = activities.filter((a) => a.latitude && a.longitude)
  const unmapped    = activities.filter((a) => !a.latitude || !a.longitude)
  const positions   = mapped.map((a) => [a.latitude, a.longitude])
  const activeTypes = [...new Set(mapped.map((a) => a.type))]
  const defaultCenter = positions.length > 0 ? positions[0] : [-15.7801, -47.9292]

  return (
    <div className="flex flex-col gap-4">

      {/* Mapa */}
      {mapped.length === 0 ? (
        <div className="h-72 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
          <span className="text-4xl">🗺️</span>
          <p className="font-medium">Nenhuma atividade com localização</p>
          <p className="text-xs text-center max-w-xs">
            Adicione latitude e longitude ao criar ou editar uma atividade para ela aparecer aqui
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border shadow-sm">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '420px', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds positions={positions} />

            {mapped.map((activity) => (
              <Marker
                key={activity.id}
                position={[activity.latitude, activity.longitude]}
                icon={createCustomIcon(activity.type)}
                eventHandlers={{ click: () => setSelectedId(activity.id) }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-gray-800 text-sm mb-1">
                      {TYPE_CONFIG[activity.type]?.emoji} {activity.title}
                    </p>
                    {activity.locationName && (
                      <p className="text-xs text-gray-500 mb-1">
                        📍 {activity.locationName}
                      </p>
                    )}
                    {activity.startTime && (
                      <p className="text-xs text-gray-500 mb-1">
                        ⏰ {activity.startTime}
                        {activity.endTime && ` → ${activity.endTime}`}
                      </p>
                    )}
                    {activity.cost > 0 && (
                      <p className="text-xs text-gray-500">
                        💰 R$ {Number(activity.cost).toFixed(2)}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-xs text-gray-400 mt-1 border-t pt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapLegend types={activeTypes} />
          </MapContainer>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-xl p-3 text-center bg-blue-50">
          <p className="text-2xl font-bold text-blue-600">{mapped.length}</p>
          <p className="text-xs text-blue-500 mt-0.5">No mapa</p>
        </div>
        <div className="border rounded-xl p-3 text-center bg-gray-50">
          <p className="text-2xl font-bold text-gray-500">{unmapped.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Sem localização</p>
        </div>
        <div className="border rounded-xl p-3 text-center bg-purple-50">
          <p className="text-2xl font-bold text-purple-600">{activities.length}</p>
          <p className="text-xs text-purple-500 mt-0.5">Total</p>
        </div>
      </div>

      {/* Lista mapeadas */}
      {mapped.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-sm font-semibold text-gray-700">📍 Atividades no mapa</p>
          </div>
          <div className="divide-y">
            {mapped.map((activity) => {
              const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.OTHER
              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                    selectedId === activity.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() =>
                    setSelectedId(selectedId === activity.id ? null : activity.id)
                  }
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                    style={{ backgroundColor: config.color + '20' }}
                  >
                    {config.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.title}
                    </p>
                    {activity.locationName && (
                      <p className="text-xs text-gray-400 truncate">
                        {activity.locationName}
                      </p>
                    )}
                  </div>
                  {activity.startTime && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {activity.startTime}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sem localização */}
      {unmapped.length > 0 && (
        <div className="border border-dashed rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-sm font-semibold text-gray-500">
              ⚠️ Sem localização ({unmapped.length})
            </p>
          </div>
          <div className="divide-y">
            {unmapped.map((activity) => {
              const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.OTHER
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-4 py-3 opacity-60"
                >
                  <span className="text-sm">{config.emoji}</span>
                  <p className="text-sm text-gray-600 truncate">{activity.title}</p>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t">
            <p className="text-xs text-gray-400">
              Edite essas atividades e adicione uma localização para exibi-las no mapa
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
