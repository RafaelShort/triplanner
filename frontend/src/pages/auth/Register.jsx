import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export default function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const { register }            = useAuth()
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()

  const redirect = searchParams.get('redirect') || '/trips'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      navigate(redirect)        
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        {/* Logo + nome do app */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="TriPlanner"
            className="h-40 w-40 object-contain mb-3"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Tri<span className="text-orange-500">Planner</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Rede de planejamento de viagens
          </p>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">
          Criar Conta
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={6}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Já tem conta?{' '}
          <Link
            to={`/login${redirect !== '/trips' ? `?redirect=${redirect}` : ''}`}
            className="text-blue-600 hover:underline font-medium"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
