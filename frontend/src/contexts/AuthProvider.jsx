import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token     = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        // JSON corrompido — limpa tudo
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  async function register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, setUser: updateUser, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}
