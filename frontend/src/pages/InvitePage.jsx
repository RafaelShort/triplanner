import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { notify } from '../utils/toast'

export default function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // 'accepted' | 'rejected'

  useEffect(() => {
    fetchInvitation()
  }, [token])

  async function fetchInvitation() {
    try {
      const response = await api.get(`/invitations/${token}`)
      setInvitation(response.data.invitation)
    } catch (err) {
      setError(err.response?.data?.message || 'Convite inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!user) {
      navigate(`/login?redirect=/invites/${token}`)
      return
    }
    setProcessing(true)
    try {
      const response = await api.post(`/invitations/${token}/accept`)
      setDone('accepted')
      notify.success('Convite aceito! Bem-vindo à viagem 🎉')
      setTimeout(() => navigate(`/trips/${response.data.tripId}`), 2500)
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao aceitar convite')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!user) {
      navigate(`/login?redirect=/invites/${token}`)
      return
    }
    setProcessing(true)
    try {
      await api.post(`/invitations/${token}/reject`)
      setDone('rejected')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao recusar convite')
    } finally {
      setProcessing(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Carregando convite...</p>
      </div>
    )
  }

  // ── Erro (inválido / expirado) ───────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <p className="text-5xl mb-4">⌛</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Convite inválido
          </h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/trips" className="text-blue-600 hover:underline text-sm">
            Ir para minhas viagens
          </Link>
        </div>
      </div>
    )
  }

  // ── Convite aceito ───────────────────────────────────────────
  if (done === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Convite aceito!
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            Você agora faz parte de{' '}
            <span className="font-semibold text-gray-700">
              {invitation?.trip?.name}
            </span>
          </p>
          <p className="text-gray-400 text-xs mt-4">
            Redirecionando para a viagem...
          </p>
        </div>
      </div>
    )
  }

  // ── Convite recusado ─────────────────────────────────────────
  if (done === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <p className="text-5xl mb-4">👋</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Convite recusado
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Você recusou o convite para{' '}
            <span className="font-semibold text-gray-700">
              {invitation?.trip?.name}
            </span>
          </p>
          <Link to="/trips" className="text-blue-600 hover:underline text-sm">
            Ir para minhas viagens
          </Link>
        </div>
      </div>
    )
  }

  // ── Convite pendente ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full">

        {/* Ícone + título */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl mx-auto mb-3">
            ✈️
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Você foi convidado!
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {invitation?.inviter?.name} convidou você para participar de uma viagem
          </p>
        </div>

        {/* Card da viagem */}
        <div className="border rounded-xl p-4 mb-6 bg-gray-50">
          <p className="font-semibold text-gray-800 text-lg">
            {invitation?.trip?.name}
          </p>
          {invitation?.trip?.destination && (
            <p className="text-gray-500 text-sm mt-1">
              📍 {invitation.trip.destination}
            </p>
          )}
          {invitation?.trip?.startDate && (
            <p className="text-gray-400 text-sm mt-1">
              📅{' '}
              {new Date(invitation.trip.startDate).toLocaleDateString('pt-BR')}
              {invitation?.trip?.endDate &&
                ` → ${new Date(invitation.trip.endDate).toLocaleDateString('pt-BR')}`}
            </p>
          )}
          {invitation?.trip?.description && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-3">
              {invitation.trip.description}
            </p>
          )}
        </div>

        {/* Aviso se não estiver logado */}
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
            ⚠️ Você precisa estar logado para aceitar o convite.{' '}
            <Link
              to={`/login?redirect=/invites/${token}`}
              className="font-semibold underline"
            >
              Entrar agora
            </Link>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {processing ? 'Processando...' : '✅ Aceitar'}
          </button>
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex-1 border py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            ❌ Recusar
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">
          Convite expira em{' '}
          {invitation?.expiresAt
            ? new Date(invitation.expiresAt).toLocaleDateString('pt-BR')
            : '7 dias'}
        </p>
      </div>
    </div>
  )
}
