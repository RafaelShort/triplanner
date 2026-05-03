import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const { login }               = useAuth()
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()

  const redirect = searchParams.get('redirect') || '/trips'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirect)
    } catch (err) {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        {/* ✅ Logo + nome do app */}
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
          Entrar
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Não tem conta?{' '}
          <Link
            to={`/register${redirect !== '/trips' ? `?redirect=${redirect}` : ''}`}
            className="text-blue-600 hover:underline font-medium"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
