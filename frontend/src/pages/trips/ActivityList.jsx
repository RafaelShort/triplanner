import { useState, useEffect } from 'react'
import api from '../../services/api'
import LocationPicker from '../../components/LocationPicker'
import ActivityComments from '../../components/ActivityComments'

const TYPES = [
  { value: 'ACTIVITY',      label: '🎯 Atividade' },
  { value: 'RESTAURANT',          label: '🍽️ Refeição' },
  { value: 'TRANSPORT',     label: '🚗 Transporte' },
  { value: 'ACCOMMODATION', label: '🏨 Hospedagem' },
  { value: 'OTHER',         label: '📌 Outro' },
]

function getTypeIcon(type) {
  return TYPES.find((t) => t.value === type)?.label.split(' ')[0] || '📌'
}

const emptyForm = {
  title:        '',
  startTime:    '',
  locationName: '',
  latitude:     null,
  longitude:    null,
  description:  '',
  type:         'ACTIVITY',
}

// ✅ recebe canEdit do DayList
export default function ActivityList({ tripId, dayId, canEdit = false }) {
  const [activities, setActivities]         = useState([])
  const [loading, setLoading]               = useState(true)
  const [adding, setAdding]                 = useState(false)
  const [editingId, setEditingId]           = useState(null)
  const [openCommentsId, setOpenCommentsId] = useState(null)
  const [form, setForm]                     = useState(emptyForm)
  const [error, setError]                   = useState('')

  useEffect(() => {
    fetchActivities()
  }, [dayId])

  async function fetchActivities() {
    try {
      const response = await api.get(`/trips/${tripId}/activities?dayId=${dayId}`)
      setActivities(response.data.activities || [])
    } catch {
      setError('Erro ao carregar atividades')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.title.trim()) return setError('O título é obrigatório')
    try {
      const response = await api.post(`/trips/${tripId}/activities`, {
        ...form,
        dayId,
      })
      setActivities((prev) => [...prev, response.data.activity])
      setForm(emptyForm)
      setAdding(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar atividade')
    }
  }

  async function handleUpdate(id) {
    if (!form.title.trim()) return setError('O título é obrigatório')
    try {
      const response = await api.put(`/trips/${tripId}/activities/${id}`, form)
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? response.data.activity : a))
      )
      setEditingId(null)
      setForm(emptyForm)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar atividade')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja remover esta atividade?')) return
    try {
      await api.delete(`/trips/${tripId}/activities/${id}`)
      setActivities((prev) => prev.filter((a) => a.id !== id))
      if (openCommentsId === id) setOpenCommentsId(null)
    } catch {
      alert('Erro ao remover atividade')
    }
  }

  function startEdit(activity) {
    setEditingId(activity.id)
    setAdding(false)
    setOpenCommentsId(null)
    setForm({
      title:        activity.title        || '',
      startTime:    activity.startTime    || '',
      locationName: activity.locationName || '',
      latitude:     activity.latitude     || null,
      longitude:    activity.longitude    || null,
      description:  activity.description  || '',
      type:         activity.type         || 'ACTIVITY',
    })
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setAdding(false)
    setForm(emptyForm)
    setError('')
  }

  function toggleComments(id) {
    setOpenCommentsId((prev) => (prev === id ? null : id))
    if (editingId) cancelEdit()
  }

  if (loading) {
    return <p className="text-xs text-gray-400 py-2">Carregando atividades...</p>
  }

  return (
    <div className="border-t pt-3 mt-1">

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-600">
          🎯 Atividades{' '}
          {activities.length > 0 && (
            <span className="text-gray-400 font-normal">({activities.length})</span>
          )}
        </p>
        {/* ✅ botão só aparece para canEdit */}
        {canEdit && !adding && !editingId && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            + Adicionar
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      {/* Formulário de nova atividade */}
      {canEdit && adding && (
        <ActivityForm
          form={form}
          setForm={setForm}
          onSave={handleAdd}
          onCancel={cancelEdit}
        />
      )}

      {/* Lista vazia */}
      {activities.length === 0 && !adding && (
        <p className="text-xs text-gray-400 py-2 text-center">
          Nenhuma atividade ainda
          {canEdit && (
            <>
              {' '}•{' '}
              <button
                onClick={() => setAdding(true)}
                className="text-blue-600 hover:underline"
              >
                Adicionar
              </button>
            </>
          )}
        </p>
      )}

      {/* Lista de atividades */}
      {activities.length > 0 && (
        <div className="flex flex-col gap-2">
          {activities
            .slice()
            .sort((a, b) =>
              (a.startTime || '').localeCompare(b.startTime || '')
            )
            .map((activity) => (
              <div
                key={activity.id}
                className="bg-gray-50 rounded-lg border overflow-hidden"
              >
                {canEdit && editingId === activity.id ? (
                  // Formulário de edição
                  <div className="p-3">
                    <ActivityForm
                      form={form}
                      setForm={setForm}
                      onSave={() => handleUpdate(activity.id)}
                      onCancel={cancelEdit}
                    />
                  </div>
                ) : (
                  <>
                    {/* Card principal */}
                    <div className="flex items-start justify-between p-3 gap-2">
                      <div className="flex gap-2 flex-1 min-w-0">
                        <span className="text-lg shrink-0">
                          {getTypeIcon(activity.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {activity.title}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-0.5">
                            {activity.startTime && (
                              <span>🕐 {activity.startTime}</span>
                            )}
                            {activity.locationName && (
                              <span>
                                📍 {activity.locationName}
                                {activity.latitude && (
                                  <span className="ml-1 text-green-500">✓ mapa</span>
                                )}
                              </span>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* ✅ comentários visíveis para todos */}
                        <button
                          onClick={() => toggleComments(activity.id)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                            openCommentsId === activity.id
                              ? 'bg-blue-100 text-blue-600 font-medium'
                              : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                          }`}
                          title="Comentários"
                        >
                          💬
                        </button>

                        {/* ✅ editar/remover apenas para canEdit */}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => startEdit(activity)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remover
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Seção de comentários colapsável */}
                    {openCommentsId === activity.id && (
                      <div className="border-t px-3 py-3 bg-white">
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          💬 Comentários
                        </p>
                        <ActivityComments
                          tripId={tripId}
                          activityId={activity.id}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ── Formulário reutilizável ────────────────────────────────────
function ActivityForm({ form, setForm, onSave, onCancel }) {
  const [showMap, setShowMap] = useState(!!(form.latitude && form.longitude))

  function handleLocationChange(loc) {
    if (!loc) {
      setForm({ ...form, locationName: '', latitude: null, longitude: null })
    } else {
      setForm({
        ...form,
        locationName: loc.name || form.locationName,
        latitude:     loc.lat,
        longitude:    loc.lng,
      })
    }
  }

  return (
    <div className="flex flex-col gap-2 bg-white border rounded-lg p-3">
      <input
        type="text"
        placeholder="Título da atividade *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      <div className="flex gap-2">
        <input
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          className="border rounded px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border rounded px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 font-medium">📍 Localização</label>
          <button
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              showMap
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            {showMap ? '✕ Fechar mapa' : '🗺️ Abrir mapa'}
          </button>
        </div>

        <input
          type="text"
          placeholder="Nome do local (ex: Torre Eiffel)"
          value={form.locationName}
          onChange={(e) => setForm({ ...form, locationName: e.target.value })}
          className="border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        {form.latitude && form.longitude && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-2 py-1">
            <span className="text-xs text-green-700">✅ Coordenadas definidas no mapa</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, latitude: null, longitude: null })}
              className="text-xs text-red-400 hover:text-red-600"
            >
              ✕ Remover
            </button>
          </div>
        )}

        {showMap && (
          <div className="border rounded-lg overflow-hidden mt-1">
            <LocationPicker
              value={
                form.latitude && form.longitude
                  ? { lat: form.latitude, lng: form.longitude, name: form.locationName }
                  : null
              }
              onChange={handleLocationChange}
            />
          </div>
        )}
      </div>

      <textarea
        placeholder="Observações (opcional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
        className="border rounded px-2 py-1.5 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
