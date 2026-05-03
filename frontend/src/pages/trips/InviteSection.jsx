import { useState, useEffect } from 'react'
import api from '../../services/api'

const STATUS_LABEL = {
  PENDING:  { label: '⏳ Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  ACCEPTED: { label: '✅ Aceito',   className: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: '❌ Recusado', className: 'bg-red-50 text-red-700 border-red-200' },
  EXPIRED:  { label: '⌛ Expirado', className: 'bg-gray-50 text-gray-500 border-gray-200' },
}

// ✅ recebe myRole do TripDetail
export default function InviteSection({ tripId, myRole }) {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [email, setEmail]             = useState('')
  const [adding, setAdding]           = useState(false)
  const [error, setError]             = useState('')
  const [copiedId, setCopiedId]       = useState(null)

  // ✅ só OWNER e EDITOR podem convidar
  const canInvite = ['OWNER', 'EDITOR'].includes(myRole)

  useEffect(() => {
    fetchInvitations()
  }, [tripId])

  async function fetchInvitations() {
    try {
      const response = await api.get(`/trips/${tripId}/invitations`)
      setInvitations(response.data.invitations || [])
    } catch (err) {
      console.error('Erro ao carregar convites:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!email.trim()) return setError('Informe um email')
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Email inválido')

    setAdding(true)
    setError('')

    try {
      const response = await api.post(`/trips/${tripId}/invitations`, { email })
      setInvitations((prev) => [response.data.invitation, ...prev])
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar convite')
    } finally {
      setAdding(false)
    }
  }

  async function handleCancel(id) {
    if (!confirm('Deseja cancelar este convite?')) return
    try {
      await api.delete(`/trips/${tripId}/invitations/${id}`)
      setInvitations((prev) => prev.filter((i) => i.id !== id))
    } catch {
      alert('Erro ao cancelar convite')
    }
  }

  function copyLink(token, id) {
    const link = `${window.location.origin}/invites/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return <p className="text-sm text-gray-400">Carregando convites...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">📨 Convites</h2>
      </div>

      {/* ✅ formulário visível apenas para OWNER e EDITOR */}
      {canInvite ? (
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Email do convidado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            className="border rounded px-3 py-2 text-sm flex-1"
          />
          <button
            onClick={handleInvite}
            disabled={adding}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 shrink-0"
          >
            {adding ? 'Enviando...' : 'Convidar'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">
          Apenas donos e editores podem enviar convites.
        </p>
      )}

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {/* Lista de convites */}
      {invitations.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border rounded-lg">
          <p className="text-3xl mb-2">📨</p>
          <p>Nenhum convite enviado ainda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {invitations.map((invite) => {
            const status = STATUS_LABEL[invite.status] || STATUS_LABEL.PENDING
            return (
              <div
                key={invite.id}
                className="border rounded-lg p-3 flex items-center justify-between flex-wrap gap-2"
              >
                <div>
                  <p className="font-medium text-sm">{invite.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Convidado por {invite.inviter?.name} •{' '}
                    {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${status.className}`}
                  >
                    {status.label}
                  </span>

                  {/* ✅ ações de cancelar/copiar só para quem pode convidar */}
                  {canInvite && invite.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => copyLink(invite.token, invite.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {copiedId === invite.id ? '✅ Copiado!' : '🔗 Copiar link'}
                      </button>
                      <button
                        onClick={() => handleCancel(invite.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
