import { useState, useEffect } from 'react'
import api from '../services/api'

function StatCard({ icon, label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  }

  return (
    <div
      className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${colors[color] || colors.blue}`}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs font-medium leading-tight truncate">{label}</p>
        {sub && (
          <p className="text-xs opacity-60 mt-0.5 truncate">{sub}</p>
        )}
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="border rounded-xl px-4 py-3 bg-gray-50 animate-pulse flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-5 w-12 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export default function DashboardStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await api.get('/stats/me')
      setStats(response.data)
    } catch {
      // silencioso — stats são opcionais
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard
        icon="🗺️"
        label="Viagens"
        value={stats.totalTrips}
        sub={
          stats.upcomingTrips > 0
            ? `${stats.upcomingTrips} em breve`
            : 'Nenhuma em breve'
        }
        color="blue"
      />
      <StatCard
        icon="🗓️"
        label="Dias planejados"
        value={stats.totalDays}
        sub={`em ${stats.totalTrips} viagem(s)`}
        color="purple"
      />
      <StatCard
        icon="🎯"
        label="Atividades"
        value={stats.totalActivities}
        sub="criadas por você"
        color="green"
      />
      <StatCard
        icon="💰"
        label="Total gasto"
        value={`R$ ${stats.totalSpent.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        sub={`${stats.totalExpenses} despesa(s)`}
        color="orange"
      />
    </div>
  )
}
