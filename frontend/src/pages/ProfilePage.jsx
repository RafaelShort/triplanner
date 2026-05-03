import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getFileUrl } from '../utils/getFileUrl'
import { notify } from '../utils/toast'

function PasswordInput({ label, value, onChange, placeholder = '' }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="border rounded-lg px-3 py-2 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center border rounded-xl p-4 bg-gray-50">
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xl font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-400 mt-0.5 text-center">{label}</span>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user: authUser, setUser: setAuthUser } = useAuth()

  const avatarInputRef = useRef(null)

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // ── Nome ─────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameDirty, setNameDirty] = useState(false)

  // ── Senha ─────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  // ── Força da senha ────────────────────────────────────────────
  function getPasswordStrength(pwd) {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Muito curta', color: 'bg-red-400', width: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Fraca', color: 'bg-orange-400', width: 'w-2/4' }
    if (!/[0-9]/.test(pwd) || !/[A-Z]/.test(pwd))
      return { label: 'Média', color: 'bg-yellow-400', width: 'w-3/4' }
    return { label: 'Forte', color: 'bg-green-500', width: 'w-full' }
  }

  const passwordStrength = getPasswordStrength(passwords.newPassword)

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  async function fetchProfile() {
    try {
      const response = await api.get('/users/me')
      setUser(response.data.user)
      setName(response.data.user.name)
    } catch (err) {
      notify.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get('/stats/me')
      setStats(response.data)
    } catch {
      // stats são opcionais — falha silenciosa
    }
  }

  // ── Avatar ────────────────────────────────────────────────────
  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return notify.error('Formato inválido. Use JPG, PNG ou WEBP')
    }

    if (file.size > 5 * 1024 * 1024) {
      return notify.error('A imagem deve ter no máximo 5MB')
    }

    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const updatedUser = response.data.user
      setUser(updatedUser)
      setAvatarPreview(null)

      // Sincroniza o Header em tempo real
      if (setAuthUser) setAuthUser(updatedUser)

      notify.success('Foto atualizada!')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao enviar foto')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Nome ─────────────────────────────────────────────────────
  async function handleSaveName() {
    if (!name.trim()) return notify.error('O nome é obrigatório')
    setSavingName(true)
    try {
      const response = await api.put('/users/me', { name: name.trim() })
      const updatedUser = response.data.user
      setUser(updatedUser)
      setNameDirty(false)

      // Sincroniza o Header em tempo real
      if (setAuthUser) setAuthUser(updatedUser)

      notify.success('Nome atualizado!')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao atualizar nome')
    } finally {
      setSavingName(false)
    }
  }

  // ── Senha ─────────────────────────────────────────────────────
  async function handleSavePassword() {
    const { currentPassword, newPassword, confirmPassword } = passwords

    if (!currentPassword || !newPassword || !confirmPassword) {
      return notify.error('Preencha todos os campos')
    }
    if (newPassword.length < 6) {
      return notify.error('A nova senha deve ter ao menos 6 caracteres')
    }
    if (newPassword !== confirmPassword) {
      return notify.error('As senhas não coincidem')
    }

    setSavingPassword(true)
    try {
      await api.put('/users/me/password', passwords)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      notify.success('Senha alterada com sucesso!')
    } catch (err) {
      notify.error(err.response?.data?.message || 'Erro ao alterar senha')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Carregando perfil...</p>
      </div>
    )
  }

  const avatarSrc = avatarPreview || getFileUrl(user?.avatarUrl)

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Meu perfil</h1>
        </div>

        {/* ── Card de Avatar ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex flex-col items-center gap-4">

            {/* Avatar */}
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-5xl font-bold border-4 border-blue-50">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Loading overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Enviando...</span>
                </div>
              )}

              {/* Botão de câmera */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                title="Alterar foto"
              >
                📷
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <p className="text-gray-300 text-xs mt-1">
                Membro desde{' '}
                {new Date(user?.createdAt).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-3 w-full mt-1">
                <StatCard icon="🗺️" label="Viagens" value={stats.totalTrips ?? 0} />
                <StatCard icon="🎯" label="Atividades" value={stats.totalActivities ?? 0} />
                <StatCard icon="💰" label="Despesas" value={stats.totalExpenses ?? 0} />
              </div>
            )}
          </div>
        </div>

        {/* ── Card de Editar Nome ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Informações pessoais
          </h2>

          <div className="flex flex-col gap-4">
            {/* Nome */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameDirty(e.target.value !== user?.name)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="border rounded-lg px-3 py-2 text-sm w-full bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-300 mt-1">
                O email não pode ser alterado
              </p>
            </div>

            <button
              onClick={handleSaveName}
              disabled={savingName || !nameDirty}
              className="bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {savingName ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>

        {/* ── Card de Senha ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Alterar senha
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Use ao menos 6 caracteres com números e letras maiúsculas para uma senha forte
          </p>

          <div className="flex flex-col gap-4">
            <PasswordInput
              label="Senha atual"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
            />

            <div>
              <PasswordInput
                label="Nova senha"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />

              {/* Barra de força */}
              {passwords.newPassword && passwordStrength && (
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${
                    passwordStrength.label === 'Forte'
                      ? 'text-green-600'
                      : passwordStrength.label === 'Média'
                      ? 'text-yellow-600'
                      : 'text-red-500'
                  }`}>
                    Senha {passwordStrength.label.toLowerCase()}
                  </p>
                </div>
              )}
            </div>

            <PasswordInput
              label="Confirmar nova senha"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
            />

            {/* Confirmação visual */}
            {passwords.confirmPassword && passwords.newPassword && (
              <p
                className={`text-xs -mt-2 ${
                  passwords.newPassword === passwords.confirmPassword
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}
              >
                {passwords.newPassword === passwords.confirmPassword
                  ? '✓ As senhas coincidem'
                  : '✕ As senhas não coincidem'}
              </p>
            )}

            <button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors mt-1"
            >
              {savingPassword ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </div>

        {/* ── Zona de perigo ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Zona de perigo
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Ações irreversíveis relacionadas à sua conta
          </p>
          <Link
            to="/trips"
            className="flex items-center justify-between p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-red-600">
                Apagar conta
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Em breve — entre em contato com o suporte
              </p>
            </div>
            <span className="text-red-300 group-hover:text-red-500 transition-colors">
              →
            </span>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6 mb-2">
          TriPlanner · Versão 1.0
        </p>
      </div>
    </div>
  )
}
