import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function PanTo({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 13))
  // ✅ JSON.stringify mais explícito e seguro que .toString()
  }, [JSON.stringify(position), map])
  return null
}

export default function LocationPicker({ value, onChange }) {
  const [position, setPosition] = useState(
    value?.lat && value?.lng ? [value.lat, value.lng] : null
  )
  const [search, setSearch]       = useState(value?.name || '')
  const [searching, setSearching] = useState(false)
  const [results, setResults]     = useState([])

  async function handleSearch() {
    const query = search.trim()
    if (!query) return
    setSearching(true)
    setResults([])
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=pt-BR`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      )
      const data = await response.json()
      setResults(data)
    } catch {
      // silencioso
    } finally {
      setSearching(false)
    }
  }

  function selectResult(result) {
    const lat  = parseFloat(result.lat)
    const lng  = parseFloat(result.lon)
    const name = result.display_name.split(',')[0]
    setPosition([lat, lng])
    setResults([])
    setSearch(name)
    onChange({ lat, lng, name })
  }

  function handleMapClick(lat, lng) {
    setPosition([lat, lng])
    onChange({ lat, lng, name: search || undefined })
  }

  function handleClear() {
    setPosition(null)
    setSearch('')
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Busca */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          placeholder="Buscar endereço ou local..."
          className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {searching ? '...' : '🔍'}
        </button>
      </div>

      {/* Resultados da busca */}
      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden shadow-sm max-h-36 overflow-y-auto z-10 relative bg-white">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => selectResult(result)}
              className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 border-b last:border-0 transition-colors"
            >
              📍 {result.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Mapa */}
      <div className="rounded-xl overflow-hidden border shadow-sm">
        <MapContainer
          center={position || [-15.7801, -47.9292]}
          zoom={position ? 14 : 4}
          style={{ height: '220px', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={handleMapClick} />
          {position && (
            <>
              <Marker position={position} />
              <PanTo position={position} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Info do ponto selecionado */}
      {position ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <p className="text-xs text-green-700">
            📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            ✕ Remover
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          Busque um endereço ou clique no mapa para definir a localização
        </p>
      )}
    </div>
  )
}
