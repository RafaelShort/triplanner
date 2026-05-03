import { useState, useEffect } from 'react'
import api from '../../services/api'
import { notify } from '../../utils/toast'

const CATEGORIES = [
  {
    key: 'DOCUMENTS',
    label: '📄 Documentos',
    suggestions: [
      'Passaporte', 'Visto', 'Seguro viagem',
      'Carteira de identidade', 'Cartão de crédito/débito', 'Dinheiro local',
    ],
  },
  {
    key: 'CLOTHES',
    label: '👕 Roupas',
    suggestions: [
      'Roupas para o frio', 'Roupas leves', 'Agasalho',
      'Calçados confortáveis', 'Roupas de banho', 'Pijama',
    ],
  },
  {
    key: 'HEALTH',
    label: '💊 Saúde',
    suggestions: [
      'Remédios de uso contínuo', 'Protetor solar', 'Repelente',
      'Analgésico', 'Antialérgico', 'Termômetro',
    ],
  },
  {
    key: 'ELECTRONICS',
    label: '🔌 Eletrônicos',
    suggestions: [
      'Carregador do celular', 'Adaptador de tomada', 'Power bank',
      'Fone de ouvido', 'Câmera fotográfica', 'Notebook/tablet',
    ],
  },
  {
    key: 'GENERAL',
    label: '📦 Geral',
    suggestions: [
      'Óculos de sol', 'Guarda-chuva', 'Mochila pequena',
      'Garrafa de água', 'Livro / entretenimento', 'Snacks para viagem',
    ],
  },
]

// ✅ recebe canEdit do TripDetail
export default function ChecklistSection({ tripId, canEdit = false }) {
  const [items, setItems]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [newText, setNewText]             = useState('')
  const [newCategory, setNewCategory]     = useState('GENERAL')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.map((c) => c.key)
  )

  useEffect(() => {
    fetchItems()
  }, [tripId])

  async function fetchItems() {
    try {
      const response = await api.get(`/trips/${tripId}/checklist`)
      setItems(response.data.items || [])
    } catch {
      notify.error('Erro ao carregar checklist')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(text = newText, category = newCategory) {
    const trimmed = String(text).trim()
    if (!trimmed) return notify.error('Digite um item')

    try {
      const response = await api.post(`/trips/${tripId}/checklist`, {
        text: trimmed,
        category,
      })
      setItems((prev) => [...prev, response.data.item])
      if (text === newText) setNewText('')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao adicionar item')
    }
  }

  async function handleToggle(id) {
    try {
      const response = await api.patch(`/trips/${tripId}/checklist/${id}/toggle`)
      setItems((prev) =>
        prev.map((item) => (item.id === id ? response.data.item : item))
      )
    } catch {
      notify.error('Erro ao atualizar item')
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/trips/${tripId}/checklist/${id}`)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch {
      notify.error('Erro ao remover item')
    }
  }

  function toggleCategory(key) {
    setOpenCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const totalItems   = items.length
  const checkedItems = items.filter((i) => i.checked).length
  const progress     = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = items.filter((i) => i.category === cat.key)
    return acc
  }, {})

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando checklist...</p>
  }

  return (
    <div>
      {/* Header com progresso */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-xl font-semibold">✅ Checklist de viagem</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {checkedItems} de {totalItems} itens concluídos
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-600">{progress}%</span>
          <p className="text-xs text-gray-400">completo</p>
        </div>
      </div>

      {/* Barra de progresso */}
      {totalItems > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Formulário de adição — visível a todos (backend permite) */}
      <div className="border rounded-xl p-4 mb-5 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-3">Adicionar item</p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome do item..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showSuggestions ? '▲ Ocultar sugestões' : '▼ Ver sugestões'}
            </button>
            <button
              onClick={() => handleAdd()}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700"
            >
              + Adicionar
            </button>
          </div>

          {showSuggestions && (
            <div className="mt-1">
              <p className="text-xs text-gray-500 mb-2">
                Clique para adicionar rapidamente:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.find((c) => c.key === newCategory)?.suggestions.map(
                  (suggestion) => {
                    const alreadyAdded = items.some(
                      (i) => i.text.toLowerCase() === suggestion.toLowerCase()
                    )
                    return (
                      <button
                        key={suggestion}
                        onClick={() => !alreadyAdded && handleAdd(suggestion, newCategory)}
                        disabled={alreadyAdded}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          alreadyAdded
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 cursor-pointer'
                        }`}
                      >
                        {alreadyAdded ? '✓' : '+'} {suggestion}
                      </button>
                    )
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista por categoria */}
      {totalItems > 0 ? (
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => {
            const catItems = groupedItems[cat.key] || []
            if (catItems.length === 0) return null

            const isOpen       = openCategories.includes(cat.key)
            const catChecked   = catItems.filter((i) => i.checked).length
            const catComplete  = catChecked === catItems.length && catItems.length > 0

            return (
              <div key={cat.key} className="border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-700">
                      {cat.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({catChecked}/{catItems.length})
                    </span>
                    {catComplete && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Completo
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="divide-y">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 group transition-colors"
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggle(item.id)}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0"
                          />
                          <span
                            className={`text-sm transition-all ${
                              item.checked ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            {item.text}
                          </span>
                        </label>

                        {/* ✅ botão deletar apenas para OWNER/EDITOR */}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors text-sm ml-2 opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {progress === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-green-700 font-semibold">Tudo pronto! Boa viagem!</p>
              <p className="text-green-600 text-sm mt-0.5">
                Todos os itens foram marcados
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 border rounded-xl">
          <p className="text-3xl mb-2">✅</p>
          <p>Nenhum item na checklist ainda</p>
          <p className="text-xs mt-1 text-gray-300">
            Use as sugestões acima para começar rapidamente!
          </p>
        </div>
      )}
    </div>
  )
}
