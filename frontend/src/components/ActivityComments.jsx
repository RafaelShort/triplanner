import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getFileUrl } from '../utils/getFileUrl'

function MiniAvatar({ name, avatarUrl }) {
  const src = getFileUrl(avatarUrl)
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white"
      />
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-white">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins  <  1) return 'agora mesmo'
  if (mins  < 60) return `${mins}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days  <  7) return `${days}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function ActivityComments({ tripId, activityId }) {
  const { user } = useAuth()
  const [comments, setComments]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [content, setContent]         = useState('')
  const [sending, setSending]         = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [editContent, setEditContent] = useState('')
  const [error, setError]             = useState('')
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetchComments()
  }, [activityId])

  useEffect(() => {
    if (!loading && comments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading])

  async function fetchComments() {
    try {
      const response = await api.get(
        `/trips/${tripId}/activities/${activityId}/comments`
      )
      setComments(response.data.comments || [])
    } catch {
      setError('Erro ao carregar comentários')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!content.trim()) return
    setError('') // ✅ limpa erro antes de nova operação
    setSending(true)
    try {
      const response = await api.post(
        `/trips/${tripId}/activities/${activityId}/comments`,
        { content }
      )
      setComments((prev) => [...prev, response.data.comment])
      setContent('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar comentário')
    } finally {
      setSending(false)
    }
  }

  async function handleUpdate(commentId) {
    if (!editContent.trim()) return
    setError('') // ✅ limpa erro antes de nova operação
    try {
      const response = await api.put(
        `/trips/${tripId}/activities/${activityId}/comments/${commentId}`,
        { content: editContent }
      )
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? response.data.comment : c))
      )
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao editar comentário')
    }
  }

  async function handleDelete(commentId) {
    if (!confirm('Remover este comentário?')) return
    setError('') // ✅ limpa erro antes de nova operação
    try {
      await api.delete(
        `/trips/${tripId}/activities/${activityId}/comments/${commentId}`
      )
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      // ✅ usa error state em vez de alert()
      setError('Erro ao remover comentário')
    }
  }

  function startEdit(comment) {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setError('') // ✅ limpa erro ao iniciar edição
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Lista de comentários */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <p className="text-2xl mb-1">💬</p>
          <p className="text-xs">Nenhum comentário ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isOwn     = comment.userId === user?.id
            const isEditing = editingId === comment.id

            return (
              <div key={comment.id} className="flex gap-2 group">
                <MiniAvatar
                  name={comment.user?.name}
                  avatarUrl={comment.user?.avatarUrl}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700">
                      {isOwn ? 'Você' : comment.user?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-gray-300 italic">(editado)</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1 flex flex-col gap-1.5">
                      <textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="border rounded-lg px-2 py-1.5 text-xs w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdate(comment.id)}
                          className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditContent('') }}
                          className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`mt-0.5 text-xs rounded-lg px-3 py-2 whitespace-pre-wrap break-words ${
                        isOwn
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {comment.content}
                    </div>
                  )}

                  {isOwn && !isEditing && (
                    <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(comment)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Input de novo comentário */}
      <div className="flex gap-2 items-end border-t pt-3">
        <MiniAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
        <div className="flex-1 flex gap-2 items-end">
          {/* ✅ substituído fieldSizing por solução cross-browser */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva um comentário... (Enter para enviar)"
            rows={1}
            className="flex-1 border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            style={{ minHeight: '36px', maxHeight: '96px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending ? '...' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}
