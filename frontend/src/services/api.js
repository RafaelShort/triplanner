import axios from 'axios'

const api = axios.create({
  // Dev (sem VITE_API_URL): usa '/api' → Vite proxia para localhost:3001/api
  // Prod (com VITE_API_URL): usa a URL completa do backend
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      const currentPath = window.location.pathname + window.location.search
      const isLoginPage = currentPath.startsWith('/login')

      if (!isLoginPage) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      }
    }
    return Promise.reject(error)
  }
)

export default api
