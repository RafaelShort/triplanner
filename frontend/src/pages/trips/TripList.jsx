import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext' 
import api from '../../services/api'
import { getFileUrl } from '../../utils/getFileUrl'
import { notify } from '../../utils/toast'
import DashboardStats from '../../components/DashboardStats'

export default function TripList() {
  const { user }    = useAuth() 
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [sortBy, setSortBy]   = useState('recent')

  useEffect(() => {
    fetchTrips()
  }, [])

  async function fetchTrips() {
    try {
      const response = await api.get('/trips')
      setTrips(response.data.trips || [])
    } catch {
      setError('Erro ao carregar viagens')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Deseja realmente excluir "${name}"?`)) return
    try {
      await api.delete(`/trips/${id}`)
      setTrips((prev) => prev.filter((t) => t.id !== id))
      notify.success('Viagem excluída!')
    } catch {
      notify.error('Erro ao excluir viagem')
    }
  }

  function getTripStatus(trip) {
    const now = new Date()
    if (!trip.startDate) return 'all'
    if (trip.endDate && new Date(trip.endDate) < now) return 'past'
    if (new Date(trip.startDate) > now) return 'upcoming'
    return 'ongoing'
  }

  function getStatusBadge(trip) {
    const status = getTripStatus(trip)
    const badges = {
      upcoming: { label: 'Em breve',      class: 'bg-green-100 text-green-700' },
      ongoing:  { label: 'Em andamento',  class: 'bg-yellow-100 text-yellow-700' },
      past:     { label: 'Realizada',     class: 'bg-gray-100 text-gray-500' },
    }
    return badges[status] || null
  }

  function getMyRole(trip) {
    return trip.members?.find((m) => m.userId === user?.id)?.role
  }

const filteredAndSorted = useMemo(() => {
  let result = trips.filter((trip) => {
    const term = search.toLowerCase()
    const matchesSearch =
      trip.name.toLowerCase().includes(term) ||
      (trip.destination || '').toLowerCase().includes(term)
    const matchesFilter =
      filter === 'all' || getTripStatus(trip) === filter
    return matchesSearch && matchesFilter
  })

  switch (sortBy) {
    case 'name':
      result = [...result].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
      )
      break

    case 'date':
      result = [...result].sort((a, b) => {
        if (!a.startDate && !b.startDate) return 0
        if (!a.startDate) return 1
        if (!b.startDate) return -1
        return new Date(a.startDate) - new Date(b.startDate)
      })
      break

    case 'recent':
    default:
      result = [...result].sort((a, b) => {
        if (!a.startDate && !b.startDate) {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }
        if (!a.startDate) return 1
        if (!b.startDate) return -1
        return new Date(b.startDate) - new Date(a.startDate)
      })
  }
  return result
}, [trips, search, filter, sortBy])


  if (loading) return <p className="text-center mt-10">Carregando...</p>

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minhas Viagens</h1>
        <Link
          to="/trips/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          + Nova Viagem
        </Link>
      </div>

      <DashboardStats />

      {/* Busca + Ordenação */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nome ou destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="recent">📅 Mais recentes</option>
          <option value="name">🔤 Nome (A-Z)</option>
          <option value="date">📆 Data de início</option>
        </select>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'all',      label: '🗺️ Todas' },
          { key: 'upcoming', label: '📅 Em breve' },
          { key: 'ongoing',  label: '✈️ Em andamento' },
          { key: 'past',     label: '✅ Realizadas' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {search && (
        <p className="text-sm text-gray-400 mb-3">
          {filteredAndSorted.length === 0
            ? 'Nenhum resultado encontrado'
            : `${filteredAndSorted.length} resultado(s) para "${search}"`}
        </p>
      )}

      {/* Cards */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="text-xl mb-2">
            {search
              ? 'Nenhuma viagem encontrada para essa busca'
              : filter === 'all'
              ? 'Nenhuma viagem encontrada'
              : 'Nenhuma viagem nessa categoria'}
          </p>
          {!search && filter === 'all' && (
            <Link to="/trips/new" className="text-blue-600 underline text-sm">
              Criar primeira viagem
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSorted.map((trip) => {
            const badge    = getStatusBadge(trip)
            const coverSrc = getFileUrl(trip.coverImage)
            const myRole   = getMyRole(trip)

            return (
              <div
                key={trip.id}
                className="border rounded-xl shadow-sm overflow-hidden flex flex-col bg-white hover:shadow-md transition-shadow"
              >
                {/* Capa */}
                <div className="relative w-full h-40">
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt={trip.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <span className="text-white text-4xl">✈️</span>
                    </div>
                  )}
                  {badge && (
                    <span
                      className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full ${badge.class}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="text-lg font-semibold">{trip.name}</h2>

                  {trip.destination && (
                    <p className="text-gray-500 text-sm mt-1">
                      📍 {trip.destination}
                    </p>
                  )}

                  {trip.startDate && (
                    <p className="text-gray-400 text-sm mt-1">
                      📅 {new Date(trip.startDate).toLocaleDateString('pt-BR')}
                      {trip.endDate &&
                        ` → ${new Date(trip.endDate).toLocaleDateString('pt-BR')}`}
                    </p>
                  )}

                  {trip.description && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {trip.description}
                    </p>
                  )}

                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>🗓️ {trip._count?.activities ?? 0} atividades</span>
                    <span>💰 {trip._count?.expenses ?? 0} despesas</span>
                  </div>

                  {trip.members?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {trip.members.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          title={member.user?.name}
                          className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs border-2 border-white -ml-1 first:ml-0"
                        >
                          {member.user?.name?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {trip.members.length > 4 && (
                        <span className="text-xs text-gray-400 ml-1">
                          +{trip.members.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="flex-1 text-center bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700"
                    >
                      Ver detalhes
                    </Link>
                    {/* Editar visível apenas para OWNER e EDITOR */}
                    {['OWNER', 'EDITOR'].includes(myRole) && (
                      <Link
                        to={`/trips/${trip.id}/edit`}
                        className="flex-1 text-center border text-sm py-1.5 rounded hover:bg-gray-50"
                      >
                        Editar
                      </Link>
                    )}
                    {/* Deletar visível apenas para OWNER */}
                    {myRole === 'OWNER' && (
                      <button
                        onClick={() => handleDelete(trip.id, trip.name)}
                        className="text-red-500 text-sm px-2 hover:bg-red-50 rounded"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
