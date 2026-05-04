import { useState, useEffect } from 'react'
import api from '../../services/api'
import ActivityList from './ActivityList'

// ── Helpers de data (sem timezone shift) ──────────────────────
function formatDateBR(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function toInputDate(isoDate) {
  if (!isoDate) return ''
  return isoDate.slice(0, 10)
}

// recebe tripStartDate e tripEndDate do TripDetail
export default function DayList({ tripId, canEdit = false, tripStartDate, tripEndDate }) {
  const [days, setDays]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState({ title: '', date: '' })
  const [error, setError]         = useState('')

  // limites para o input date
  const minDate = tripStartDate ? toInputDate(tripStartDate) : undefined
  const maxDate = tripEndDate   ? toInputDate(tripEndDate)   : undefined

  useEffect(() => {
    fetchDays()
  }, [tripId])

  async function fetchDays() {
    try {
      const response = await api.get(`/trips/${tripId}/days`)
      setDays(response.data.days || [])
    } catch {
      setError('Erro ao carregar dias')
    } finally {
      setLoading(false)
    }
  }

  // ── Validação client-side ──────────────────────────────────
  function validate() {
    if (!form.title.trim()) return 'O título do dia é obrigatório'
    if (form.date && minDate && form.date < minDate) {
      return `A data deve ser a partir de ${formatDateBR(tripStartDate)}`
    }
    if (form.date && maxDate && form.date > maxDate) {
      return `A data deve ser até ${formatDateBR(tripEndDate)}`
    }
    return null
  }

  async function handleAdd() {
    const err = validate()
    if (err) return setError(err)

    try {
      const response = await api.post(`/trips/${tripId}/days`, form)
      setDays((prev) => [...prev, response.data.day])
      setForm({ title: '', date: '' })
      setAdding(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar dia')
    }
  }

  async function handleUpdate(id) {
    const err = validate()
    if (err) return setError(err)

    try {
      const response = await api.put(`/trips/${tripId}/days/${id}`, form)
      setDays((prev) => prev.map((d) => (d.id === id ? response.data.day : d)))
      setEditingId(null)
      setForm({ title: '', date: '' })
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar dia')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja remover este dia?')) return
    try {
      await api.delete(`/trips/${tripId}/days/${id}`)
      setDays((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Erro ao remover dia')
    }
  }

  function startEdit(day) {
    setEditingId(day.id)
    setAdding(false)
    setForm({
      title: day.title || '',
      date:  toInputDate(day.date),
    })
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setAdding(false)
    setForm({ title: '', date: '' })
    setError('')
  }

  if (loading) return <p className="text-sm text-gray-400">Carregando dias...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">🗓️ Dias da viagem</h2>
        {canEdit && !adding && !editingId && (
          <button
            onClick={() => setAdding(true)}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
          >
            + Adicionar dia
          </button>
        )}
      </div>

      {/* Info do range disponível */}
      {canEdit && (tripStartDate || tripEndDate) && (
        <p className="text-xs text-gray-500 mb-3">
          📅 Range da viagem: {formatDateBR(tripStartDate)} → {formatDateBR(tripEndDate)}
        </p>
      )}

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* Formulário de novo dia */}
      {canEdit && adding && (
        <div className="border rounded-lg p-4 mb-4 bg-gray-50">
          <p className="font-medium text-sm mb-3">Novo dia</p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Título do dia (ex: Chegada em Paris)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border rounded px-3 py-2 text-sm w-full"
            />
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border rounded px-3 py-2 text-sm w-full"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de dias */}
      {days.length === 0 && !adding ? (
        <div className="text-center py-10 text-gray-400 border rounded-lg">
          <p className="text-3xl mb-2">🗓️</p>
          <p>Nenhum dia adicionado ainda</p>
          {canEdit && (
            <button
              onClick={() => setAdding(true)}
              className="text-blue-600 text-sm underline mt-2"
            >
              Adicionar primeiro dia
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((day, index) => (
            <div key={day.id} className="border rounded-lg overflow-hidden">
              {canEdit && editingId === day.id ? (
                <div className="p-4 bg-gray-50">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="border rounded px-3 py-2 text-sm w-full"
                    />
                    <input
                      type="date"
                      min={minDate}
                      max={maxDate}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="border rounded px-3 py-2 text-sm w-full"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleUpdate(day.id)}
                        className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{day.title}</p>
                        <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                          {day.date && (
                            <span>📅 {formatDateBR(day.date)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(day)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(day.id)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    <ActivityList tripId={tripId} dayId={day.id} canEdit={canEdit} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
