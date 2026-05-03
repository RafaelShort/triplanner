import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  RESTAURANT: '#f59e0b',
  TRANSPORT: '#3b82f6',
  ACCOMMODATION: '#8b5cf6',
  ATTRACTION: '#10b981',
  SHOPPING: '#ec4899',
  OTHER: '#6b7280',
}

const LABELS = {
  RESTAURANT: '🍽️ Alimentação',
  TRANSPORT: '🚗 Transporte',
  ACCOMMODATION: '🏨 Hospedagem',
  ATTRACTION: '🎡 Atrações',
  SHOPPING: '🛍️ Compras',
  OTHER: '📌 Outro',
}

export default function ExpenseChart({ expenses }) {
  if (!expenses || expenses.length === 0) return null

  const grouped = expenses.reduce((acc, e) => {
    const cat = e.category || 'OTHER'
    acc[cat] = (acc[cat] || 0) + Number(e.amount)
    return acc
  }, {})

  const data = Object.entries(grouped)
    .map(([category, value]) => ({
      name: LABELS[category] || category,
      value: Number(value.toFixed(2)),
      category,
    }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="border rounded-xl p-4 bg-gray-50 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        📊 Despesas por categoria
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Gráfico */}
        <div className="w-full sm:w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={COLORS[entry.category] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `R$ ${value.toFixed(2)} (${((value / total) * 100).toFixed(1)}%)`,
                  'Valor',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda */}
        <div className="flex flex-col gap-2 w-full">
          {data.map((entry) => (
            <div
              key={entry.category}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: COLORS[entry.category] || '#6b7280',
                  }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 text-xs">
                  {((entry.value / total) * 100).toFixed(0)}%
                </span>
                <span className="font-semibold text-gray-800 w-24 text-right">
                  R$ {entry.value.toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          <div className="border-t mt-1 pt-2 flex justify-between text-sm font-bold text-gray-800">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
