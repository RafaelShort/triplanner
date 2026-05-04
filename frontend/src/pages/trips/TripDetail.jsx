import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { getFileUrl } from '../../utils/getFileUrl'
import { notify } from '../../utils/toast'
import DayList from './DayList'
import ExpenseList from './ExpenseList'
import InviteSection from './InviteSection'
import MembersSection from './MembersSection'
import ChecklistSection from './ChecklistSection'
import TripMap from '../../components/TripMap'
import WeatherCard from '../../components/WeatherCard'

const TABS = [
  { key: 'days',      label: '🗓️ Dias' },
  { key: 'expenses',  label: '💰 Despesas' },
  { key: 'members',   label: '👥 Membros' },
  { key: 'invites',   label: '📨 Convites' },
  { key: 'checklist', label: '✅ Checklist' },
  { key: 'map',       label: '🗺️ Mapa' },
  { key: 'weather',   label: '🌤️ Tempo' },
]

export default function TripDetail() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const coverInputRef = useRef(null)

  const [trip, setTrip]                     = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [activeTab, setActiveTab]           = useState('days')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverPreview, setCoverPreview]     = useState(null)

  useEffect(() => {
    fetchTrip()
  }, [id])

  async function fetchTrip() {
    try {
      const response = await api.get(`/trips/${id}`)
      setTrip(response.data.trip || response.data)
    } catch {
      setError('Viagem não encontrada')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Deseja realmente excluir esta viagem?')) return
    try {
      await api.delete(`/trips/${id}`)
      notify.success('Viagem excluída!')
      navigate('/trips')
    } catch {
      notify.error('Erro ao excluir viagem')
    }
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      notify.error('A imagem deve ter no máximo 5MB')
      return
    }

    setCoverPreview(URL.createObjectURL(file))
    setUploadingCover(true)

    try {
      const formData = new FormData()
      formData.append('coverImage', file)

      const response = await api.post(`/upload/trips/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTrip((prev) => ({ ...prev, coverImage: response.data.coverImage }))
      setCoverPreview(null)
      notify.success('Capa atualizada!')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao enviar imagem')
      setCoverPreview(null)
    } finally {
      setUploadingCover(false)
    }
  }

  if (loading) return <p className="text-center mt-10">Carregando...</p>
  if (error)   return <p className="text-center mt-10 text-red-500">{error}</p>
  if (!trip)   return null

  const myRole  = trip.members?.find((m) => m.userId === user?.id)?.role
  const canEdit = ['OWNER', 'EDITOR'].includes(myRole)
  const coverSrc = coverPreview || getFileUrl(trip.coverImage)

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* Imagem de capa */}
      <div className="relative w-full h-64 rounded-xl mb-6 overflow-hidden group">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-6xl">✈️</span>
          </div>
        )}

        {canEdit && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg shadow hover:bg-white"
            >
              {uploadingCover ? 'Enviando...' : '📷 Alterar capa'}
            </button>
          </div>
        )}

        {/* image/gif adicionado ao accept */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* Título + ações */}
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold truncate">{trip.name}</h1>
          {trip.destination && (
            <p className="text-gray-500 mt-1">📍 {trip.destination}</p>
          )}
          {trip.startDate && (
            <p className="text-gray-400 text-sm mt-1">
              📅 {new Date(trip.startDate).toLocaleDateString('pt-BR')}
              {trip.endDate &&
                ` → ${new Date(trip.endDate).toLocaleDateString('pt-BR')}`}
            </p>
          )}
          {trip.description && (
            <p className="text-gray-600 mt-3">{trip.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={`/trips/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="border px-4 py-2 rounded hover:bg-gray-50 text-sm flex items-center gap-1"
          >
            📄 Exportar PDF
          </a>


          {canEdit && (
            <>
              <Link
                to={`/trips/${id}/edit`}
                className="border px-4 py-2 rounded hover:bg-gray-50 text-sm"
              >
                Editar
              </Link>
              {myRole === 'OWNER' && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                >
                  Excluir
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      <div className="mb-6">
        {activeTab === 'days' && (
          // canEdit passado para DayList
          <DayList
            tripId={trip.id}
            canEdit={canEdit}
            tripStartDate={trip.startDate}    // ← NOVO
            tripEndDate={trip.endDate}        // ← NOVO
          />
        )}

        {activeTab === 'expenses' && (
          <div className="border rounded-xl p-4 bg-white">
            {/* canEdit passado para ExpenseList */}
            <ExpenseList tripId={id} canEdit={canEdit} />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="border rounded-xl p-4 bg-white">
            <MembersSection tripId={id} />
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="border rounded-xl p-4 bg-white">
            {/* myRole passado para InviteSection */}
            <InviteSection tripId={id} myRole={myRole} />
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="border rounded-xl p-4 bg-white">
            {/* canEdit passado para ChecklistSection */}
            <ChecklistSection tripId={id} canEdit={canEdit} />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="border rounded-xl p-4 bg-white">
            <h2 className="text-xl font-semibold mb-4">🗺️ Mapa das atividades</h2>
            <TripMap tripId={id} />
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="border rounded-xl p-4 bg-white">
            <h2 className="text-xl font-semibold mb-1">🌤️ Previsão do tempo</h2>
            {trip.destination ? (
              <p className="text-sm text-gray-400 mb-4">
                Mostrando previsão para{' '}
                <span className="font-medium text-gray-600">
                  {trip.destination}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 mb-4">
                Adicione um destino à viagem para ver a previsão
              </p>
            )}
            <WeatherCard destination={trip.destination} />
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-6 flex items-center justify-between">
        <Link to="/trips" className="text-blue-600 hover:underline text-sm">
          ← Voltar para minhas viagens
        </Link>
        <p className="text-xs text-gray-300">
          Criado em {new Date(trip.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
