import { useState, useEffect } from 'react'
import api from '../../services/api'
import { getFileUrl } from '../../utils/getFileUrl'
import { notify } from '../../utils/toast'

const ROLE_LABEL = {
  OWNER: { label: '👑 Dono', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  EDITOR: { label: '✏️ Editor', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  VIEWER: { label: '👁️ Visualizador', className: 'bg-gray-50 text-gray-600 border-gray-200' },
}

function Avatar({ name, avatarUrl }) {
  const src = getFileUrl(avatarUrl)
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

export default function MembersSection({ tripId }) {
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [tripId])

  async function fetchMembers() {
    try {
      const response = await api.get(`/trips/${tripId}/members`)
      setMembers(response.data.members || [])
      setMyRole(response.data.myRole)
    } catch (err) {
      setError('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(id, role) {
    try {
      const response = await api.put(`/trips/${tripId}/members/${id}`, { role })
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? response.data.member : m))
      )
      notify.success('Papel atualizado!')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao atualizar papel')
    }
  }

  async function handleRemove(id, name) {
    if (!confirm(`Deseja remover ${name} da viagem?`)) return
    try {
      await api.delete(`/trips/${tripId}/members/${id}`)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      notify.success(`${name} removido da viagem`)
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao remover membro')
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Carregando membros...</p>

  const isOwner = myRole === 'OWNER'
  const ownerId = members.find((m) => m.role === 'OWNER')?.userId

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">👥 Membros</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {members.length} participante(s)
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex flex-col gap-2">
        {members.map((member) => {
          const role = ROLE_LABEL[member.role] || ROLE_LABEL.VIEWER
          const isThisOwner = member.userId === ownerId

          return (
            <div
              key={member.id}
              className="border rounded-lg p-3 flex items-center justify-between flex-wrap gap-2"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={member.user?.name}
                  avatarUrl={member.user?.avatarUrl}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{member.user?.name}</p>
                    {isThisOwner && (
                      <span className="text-xs text-yellow-600">👑</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{member.user?.email}</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Entrou em{' '}
                    {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && member.role !== 'OWNER' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${role.className}`}
                  >
                    <option value="EDITOR">✏️ Editor</option>
                    <option value="VIEWER">👁️ Visualizador</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${role.className}`}
                  >
                    {role.label}
                  </span>
                )}

                {isOwner && member.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(member.id, member.user?.name)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
