import { useState, useEffect, useMemo } from 'react'
import api from '../../services/api'
import ExpenseChart from '../../components/ExpenseChart'

const CATEGORIES = [
  { value: 'RESTAURANT',          label: '🍽️ Alimentação' },
  { value: 'TRANSPORT',     label: '🚗 Transporte' },
  { value: 'ACCOMMODATION', label: '🏨 Hospedagem' },
  { value: 'ATTRACTION',    label: '🎡 Atrações' },
  { value: 'SHOPPING',      label: '🛍️ Compras' },
  { value: 'OTHER',         label: '📌 Outro' },
]

function getCategoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || '📌 Outro'
}

const emptyForm = {
  title:    '',
  amount:   '',
  category: 'OTHER',
  date:     new Date().toISOString().slice(0, 10),
}

// ✅ recebe canEdit do TripDetail
export default function ExpenseList({ tripId, canEdit = false }) {
  const [expenses, setExpenses]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [error, setError]         = useState('')

  // ✅ total derivado do array — nunca dessincroniza do estado local
  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  )

  useEffect(() => {
    fetchExpenses()
  }, [tripId])

  async function fetchExpenses() {
    try {
      const response = await api.get(`/trips/${tripId}/expenses`)
      setExpenses(response.data.expenses || [])
    } catch {
      setError('Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.title.trim()) return setError('O título é obrigatório')
    if (!form.amount || Number(form.amount) <= 0) return setError('Informe um valor válido')

    try {
      const response = await api.post(`/trips/${tripId}/expenses`, form)
      setExpenses((prev) => [response.data.expense, ...prev])
      setForm(emptyForm)
      setAdding(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar despesa')
    }
  }

  async function handleUpdate(id) {
    if (!form.title.trim()) return setError('O título é obrigatório')
    if (!form.amount || Number(form.amount) <= 0) return setError('Informe um valor válido')

    try {
      const response = await api.put(`/trips/${tripId}/expenses/${id}`, form)
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? response.data.expense : e))
      )
      setEditingId(null)
      setForm(emptyForm)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar despesa')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja remover esta despesa?')) return
    try {
      await api.delete(`/trips/${tripId}/expenses/${id}`)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch {
      alert('Erro ao remover despesa')
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id)
    setAdding(false)
    setForm({
      title:    expense.title    || '',
      amount:   expense.amount   || '',
      category: expense.category || 'OTHER',
      date:     expense.date
        ? expense.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setAdding(false)
    setForm(emptyForm)
    setError('')
  }

  if (loading) return <p className="text-sm text-gray-400">Carregando despesas...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">💰 Despesas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Total:{' '}
            <span className="font-semibold text-gray-700">
              R$ {total.toFixed(2)}
            </span>
          </p>
        </div>
        {/* ✅ botão só aparece para canEdit */}
        {canEdit && !adding && !editingId && (
          <button
            onClick={() => setAdding(true)}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
          >
            + Adicionar despesa
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {expenses.length > 0 && <ExpenseChart expenses={expenses} />}

      {/* Formulário de nova despesa */}
      {canEdit && adding && (
        <div className="border rounded-lg p-4 mb-4 bg-gray-50">
          <p className="font-medium text-sm mb-3">Nova despesa</p>
          <ExpenseForm
            form={form}
            setForm={setForm}
            onSave={handleAdd}
            onCancel={cancelEdit}
          />
        </div>
      )}

      {/* Lista */}
      {expenses.length === 0 && !adding ? (
        <div className="text-center py-10 text-gray-400 border rounded-lg">
          <p className="text-3xl mb-2">💰</p>
          <p>Nenhuma despesa registrada ainda</p>
          {canEdit && (
            <button
              onClick={() => setAdding(true)}
              className="text-blue-600 text-sm underline mt-2"
            >
              Adicionar primeira despesa
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="border rounded-lg overflow-hidden">
              {canEdit && editingId === expense.id ? (
                <div className="p-4 bg-gray-50">
                  <ExpenseForm
                    form={form}
                    setForm={setForm}
                    onSave={() => handleUpdate(expense.id)}
                    onCancel={cancelEdit}
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between p-4">
                  <div className="flex gap-3">
                    <div className="text-2xl">
                      {getCategoryLabel(expense.category).split(' ')[0]}
                    </div>
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span>
                          📅 {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span>
                          👤 Pago por{' '}
                          <span className="text-gray-600 font-medium">
                            {expense.payer?.name || 'Desconhecido'}
                          </span>
                        </span>
                        {expense.category && (
                          <span>{getCategoryLabel(expense.category)}</span>
                        )}
                      </div>

                      {/* Splits */}
                      {expense.splits?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {expense.splits.map((split) => (
                            <span
                              key={split.id}
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                split.paid
                                  ? 'bg-green-50 text-green-600 border-green-200'
                                  : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                              }`}
                            >
                              {split.user?.name} — R$ {Number(split.amount).toFixed(2)}{' '}
                              {split.paid ? '✅' : '⏳'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                    <span className="font-bold text-gray-800">
                      R$ {Number(expense.amount).toFixed(2)}
                    </span>
                    {/* ✅ botões de edição só aparecem para canEdit */}
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(expense)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulário reutilizável ───────────────────────────────────
function ExpenseForm({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Título da despesa *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="border rounded px-3 py-2 text-sm w-full"
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Valor (R$) *"
          value={form.amount}
          min="0"
          step="0.01"
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border rounded px-3 py-2 text-sm flex-1"
        />
      </div>
      <select
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        className="border rounded px-3 py-2 text-sm w-full"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2 mt-1">
        <button
          onClick={onSave}
          className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
